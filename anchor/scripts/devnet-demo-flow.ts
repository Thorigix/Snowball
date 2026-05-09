import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { SnowballEscrow } from "../target/types/snowball_escrow";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";

const PROGRAM_ID = "2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss";
const EXPLORER_BASE = "https://explorer.solana.com";
const CLUSTER_QS = "?cluster=devnet";

const TARGET_BUYERS = 3;
const DEPOSIT_LAMPORTS = 50_000_000;

const FUND_CREATOR = 80_000_000;  // 0.08 SOL
const FUND_SELLER = 50_000_000;   // 0.05 SOL
const FUND_BUYER = 120_000_000;   // 0.12 SOL each
const MIN_PROVIDER_BALANCE = 700_000_000; // 0.7 SOL

const txLink = (sig: string) =>
  `${EXPLORER_BASE}/tx/${sig}${CLUSTER_QS}`;
const addrLink = (pk: string) =>
  `${EXPLORER_BASE}/address/${pk}${CLUSTER_QS}`;

describe("snowball devnet demo flow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.snowballEscrow as Program<SnowballEscrow>;

  const findCampaignPda = (creator: PublicKey): PublicKey =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), creator.toBuffer()],
      program.programId
    )[0];

  const findContributionPda = (
    campaign: PublicKey,
    buyer: PublicKey
  ): PublicKey =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("contribution"), campaign.toBuffer(), buyer.toBuffer()],
      program.programId
    )[0];

  const fundFromProvider = async (
    pubkey: PublicKey,
    lamports: number
  ): Promise<string> => {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: pubkey,
        lamports,
      })
    );
    const sig = await provider.sendAndConfirm(tx, []);
    return sig;
  };

  it("runs full devnet escrow lifecycle", async function () {
    this.timeout(600_000);

    expect(program.programId.toBase58()).to.equal(PROGRAM_ID);

    const providerBalance = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    if (providerBalance < MIN_PROVIDER_BALANCE) {
      throw new Error(
        `Insufficient devnet SOL for demo seed flow. Provider has ${
          providerBalance / LAMPORTS_PER_SOL
        } SOL, needs at least ${MIN_PROVIDER_BALANCE / LAMPORTS_PER_SOL} SOL.`
      );
    }

    const creator = Keypair.generate();
    const seller = Keypair.generate();
    const buyer1 = Keypair.generate();
    const buyer2 = Keypair.generate();
    const buyer3 = Keypair.generate();

    const sigFundCreator = await fundFromProvider(
      creator.publicKey,
      FUND_CREATOR
    );
    const sigFundSeller = await fundFromProvider(
      seller.publicKey,
      FUND_SELLER
    );
    const sigFundBuyer1 = await fundFromProvider(
      buyer1.publicKey,
      FUND_BUYER
    );
    const sigFundBuyer2 = await fundFromProvider(
      buyer2.publicKey,
      FUND_BUYER
    );
    const sigFundBuyer3 = await fundFromProvider(
      buyer3.publicKey,
      FUND_BUYER
    );

    const campaignPda = findCampaignPda(creator.publicKey);
    const contributionPda1 = findContributionPda(campaignPda, buyer1.publicKey);
    const contributionPda2 = findContributionPda(campaignPda, buyer2.publicKey);
    const contributionPda3 = findContributionPda(campaignPda, buyer3.publicKey);

    const sigCreate = await program.methods
      .createCampaign(
        seller.publicKey,
        TARGET_BUYERS,
        new anchor.BN(DEPOSIT_LAMPORTS)
      )
      .accountsPartial({
        creator: creator.publicKey,
        campaign: campaignPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const joinCampaign = async (
      buyer: Keypair,
      contribution: PublicKey
    ): Promise<string> => {
      return await program.methods
        .joinCampaign()
        .accountsPartial({
          buyer: buyer.publicKey,
          campaign: campaignPda,
          contribution,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
    };

    const sigJoin1 = await joinCampaign(buyer1, contributionPda1);
    const sigJoin2 = await joinCampaign(buyer2, contributionPda2);
    const sigJoin3 = await joinCampaign(buyer3, contributionPda3);

    let campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.currentBuyers).to.equal(TARGET_BUYERS);
    expect(campaign.totalDeposited.toString()).to.equal(
      String(DEPOSIT_LAMPORTS * TARGET_BUYERS)
    );
    expect(campaign.status).to.have.property("funded");

    const sigMarkShipped = await program.methods
      .markShipped()
      .accountsPartial({
        seller: seller.publicKey,
        campaign: campaignPda,
      })
      .signers([seller])
      .rpc();

    const confirmDelivery = async (buyer: Keypair): Promise<string> => {
      const contribution = findContributionPda(campaignPda, buyer.publicKey);
      return await program.methods
        .confirmDelivery()
        .accountsPartial({
          buyer: buyer.publicKey,
          campaign: campaignPda,
          contribution,
        })
        .signers([buyer])
        .rpc();
    };

    const sigConfirm1 = await confirmDelivery(buyer1);
    const sigConfirm2 = await confirmDelivery(buyer2);

    campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.confirmations).to.equal(2);
    expect(campaign.status).to.have.property("shipped");

    const sellerBalanceBefore = await provider.connection.getBalance(
      seller.publicKey
    );

    const sigRelease = await program.methods
      .releaseFunds()
      .accountsPartial({
        seller: seller.publicKey,
        campaign: campaignPda,
      })
      .signers([seller])
      .rpc();

    campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.status).to.have.property("released");

    const sellerBalanceAfter = await provider.connection.getBalance(
      seller.publicKey
    );

    const fmtSol = (lamports: number) =>
      `${lamports} lamports (${(lamports / LAMPORTS_PER_SOL).toFixed(9)} SOL)`;

    const lines: string[] = [];
    lines.push("");
    lines.push("============================================================");
    lines.push("  Snowball Devnet Demo Flow — Final Summary");
    lines.push("============================================================");
    lines.push(`Program ID:      ${PROGRAM_ID}`);
    lines.push(`Program Explorer: ${addrLink(PROGRAM_ID)}`);
    lines.push("");
    lines.push("--- Public Keys ---");
    lines.push(`creator:  ${creator.publicKey.toBase58()}`);
    lines.push(`seller:   ${seller.publicKey.toBase58()}`);
    lines.push(`buyer1:   ${buyer1.publicKey.toBase58()}`);
    lines.push(`buyer2:   ${buyer2.publicKey.toBase58()}`);
    lines.push(`buyer3:   ${buyer3.publicKey.toBase58()}`);
    lines.push("");
    lines.push("--- PDAs ---");
    lines.push(`campaign:        ${campaignPda.toBase58()}`);
    lines.push(`contribution b1: ${contributionPda1.toBase58()}`);
    lines.push(`contribution b2: ${contributionPda2.toBase58()}`);
    lines.push(`contribution b3: ${contributionPda3.toBase58()}`);
    lines.push("");
    lines.push("--- Transaction Signatures ---");
    const txRow = (label: string, sig: string) => {
      lines.push(`${label}:`);
      lines.push(`  sig:  ${sig}`);
      lines.push(`  link: ${txLink(sig)}`);
    };
    txRow("fund creator", sigFundCreator);
    txRow("fund seller", sigFundSeller);
    txRow("fund buyer1", sigFundBuyer1);
    txRow("fund buyer2", sigFundBuyer2);
    txRow("fund buyer3", sigFundBuyer3);
    txRow("create campaign", sigCreate);
    txRow("buyer1 join", sigJoin1);
    txRow("buyer2 join", sigJoin2);
    txRow("buyer3 join", sigJoin3);
    txRow("mark shipped", sigMarkShipped);
    txRow("buyer1 confirm", sigConfirm1);
    txRow("buyer2 confirm", sigConfirm2);
    txRow("release funds", sigRelease);
    lines.push("");
    lines.push("--- Seller Balance ---");
    lines.push(`before release: ${fmtSol(sellerBalanceBefore)}`);
    lines.push(`after release:  ${fmtSol(sellerBalanceAfter)}`);
    lines.push(
      `delta:          ${fmtSol(sellerBalanceAfter - sellerBalanceBefore)}`
    );
    lines.push("============================================================");
    lines.push("");

    console.log(lines.join("\n"));
  });
});
