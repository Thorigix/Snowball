import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { SnowballEscrow } from "../target/types/snowball_escrow";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";

describe("snowball_escrow", () => {
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

  const fundAccount = async (pubkey: PublicKey, lamports: number) => {
    const sig = await provider.connection.requestAirdrop(pubkey, lamports);
    const latest = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction(
      { signature: sig, ...latest },
      "confirmed"
    );
  };

  const createCampaignFor = async (
    creator: Keypair,
    seller: PublicKey,
    targetBuyers: number,
    depositLamports: number
  ): Promise<PublicKey> => {
    const campaignPda = findCampaignPda(creator.publicKey);
    await program.methods
      .createCampaign(seller, targetBuyers, new anchor.BN(depositLamports))
      .accountsPartial({
        creator: creator.publicKey,
        campaign: campaignPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();
    return campaignPda;
  };

  const joinAs = async (
    buyer: Keypair,
    campaign: PublicKey
  ): Promise<PublicKey> => {
    const contributionPda = findContributionPda(campaign, buyer.publicKey);
    await program.methods
      .joinCampaign()
      .accountsPartial({
        buyer: buyer.publicKey,
        campaign,
        contribution: contributionPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    return contributionPda;
  };

  it("Initializes Snowball escrow program", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Creates a campaign", async () => {
    const seller = Keypair.generate();
    const creator = (provider.wallet as anchor.Wallet).payer;

    const campaignPda = findCampaignPda(creator.publicKey);

    await program.methods
      .createCampaign(seller.publicKey, 3, new anchor.BN(50_000_000))
      .accountsPartial({
        creator: creator.publicKey,
        campaign: campaignPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.creator.toBase58()).to.equal(
      provider.wallet.publicKey.toBase58()
    );
    expect(campaign.seller.toBase58()).to.equal(seller.publicKey.toBase58());
    expect(campaign.targetBuyers).to.equal(3);
    expect(campaign.currentBuyers).to.equal(0);
    expect(campaign.depositLamports.toString()).to.equal("50000000");
    expect(campaign.totalDeposited.toString()).to.equal("0");
    expect(campaign.confirmations).to.equal(0);
    expect(campaign.status).to.have.property("open");
  });

  it("Allows three buyers to join and marks campaign funded", async () => {
    const creator = Keypair.generate();
    const seller = Keypair.generate();
    await fundAccount(creator.publicKey, 1 * LAMPORTS_PER_SOL);

    const campaignPda = await createCampaignFor(
      creator,
      seller.publicKey,
      3,
      50_000_000
    );

    const buyer1 = Keypair.generate();
    const buyer2 = Keypair.generate();
    const buyer3 = Keypair.generate();
    await fundAccount(buyer1.publicKey, 1 * LAMPORTS_PER_SOL);
    await fundAccount(buyer2.publicKey, 1 * LAMPORTS_PER_SOL);
    await fundAccount(buyer3.publicKey, 1 * LAMPORTS_PER_SOL);

    const contribution1 = await joinAs(buyer1, campaignPda);
    const contribution2 = await joinAs(buyer2, campaignPda);
    const contribution3 = await joinAs(buyer3, campaignPda);

    const campaign = await program.account.campaign.fetch(campaignPda);
    expect(campaign.currentBuyers).to.equal(3);
    expect(campaign.totalDeposited.toString()).to.equal("150000000");
    expect(campaign.status).to.have.property("funded");

    const checkContribution = async (
      contributionPda: PublicKey,
      buyer: Keypair
    ) => {
      const c = await program.account.contribution.fetch(contributionPda);
      expect(c.campaign.toBase58()).to.equal(campaignPda.toBase58());
      expect(c.buyer.toBase58()).to.equal(buyer.publicKey.toBase58());
      expect(c.amount.toString()).to.equal("50000000");
      expect(c.confirmed).to.equal(false);
      expect(c.refunded).to.equal(false);
    };

    await checkContribution(contribution1, buyer1);
    await checkContribution(contribution2, buyer2);
    await checkContribution(contribution3, buyer3);
  });

  it("Rejects duplicate buyer join", async () => {
    const creator = Keypair.generate();
    const seller = Keypair.generate();
    await fundAccount(creator.publicKey, 1 * LAMPORTS_PER_SOL);

    const campaignPda = await createCampaignFor(
      creator,
      seller.publicKey,
      3,
      50_000_000
    );

    const buyer1 = Keypair.generate();
    await fundAccount(buyer1.publicKey, 1 * LAMPORTS_PER_SOL);

    await joinAs(buyer1, campaignPda);

    let failed = false;
    try {
      await joinAs(buyer1, campaignPda);
    } catch (err) {
      failed = true;
    }
    expect(failed, "duplicate join should fail").to.equal(true);
  });

  it("Rejects seller joining own campaign", async () => {
    const creator = Keypair.generate();
    const seller = Keypair.generate();
    await fundAccount(creator.publicKey, 1 * LAMPORTS_PER_SOL);
    await fundAccount(seller.publicKey, 1 * LAMPORTS_PER_SOL);

    const campaignPda = await createCampaignFor(
      creator,
      seller.publicKey,
      3,
      50_000_000
    );

    let failed = false;
    try {
      await joinAs(seller, campaignPda);
    } catch (err) {
      failed = true;
    }
    expect(failed, "seller join should fail").to.equal(true);
  });

  it("Rejects joining a full campaign", async () => {
    const creator = Keypair.generate();
    const seller = Keypair.generate();
    await fundAccount(creator.publicKey, 1 * LAMPORTS_PER_SOL);

    const campaignPda = await createCampaignFor(
      creator,
      seller.publicKey,
      2,
      50_000_000
    );

    const buyer1 = Keypair.generate();
    const buyer2 = Keypair.generate();
    const buyer3 = Keypair.generate();
    await fundAccount(buyer1.publicKey, 1 * LAMPORTS_PER_SOL);
    await fundAccount(buyer2.publicKey, 1 * LAMPORTS_PER_SOL);
    await fundAccount(buyer3.publicKey, 1 * LAMPORTS_PER_SOL);

    await joinAs(buyer1, campaignPda);
    await joinAs(buyer2, campaignPda);

    let failed = false;
    try {
      await joinAs(buyer3, campaignPda);
    } catch (err) {
      failed = true;
    }
    expect(failed, "join on full campaign should fail").to.equal(true);
  });
});
