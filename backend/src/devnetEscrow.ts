import fs from "fs";
import os from "os";
import path from "path";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss");
const RPC_URL = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";

const TARGET_BUYERS = 3;
const DEPOSIT_LAMPORTS = 50_000_000;
const FUND_CREATOR = 25_000_000;
const FUND_SELLER = 10_000_000;
const FUND_BUYER = 60_000_000;
const MIN_PROVIDER_BALANCE = 160_000_000;

const DISCRIMINATORS = {
  createCampaign: Buffer.from([111, 131, 187, 98, 160, 193, 114, 244]),
  joinCampaign: Buffer.from([139, 142, 101, 28, 183, 90, 68, 4]),
  markShipped: Buffer.from([239, 5, 66, 105, 238, 17, 89, 97]),
  confirmDelivery: Buffer.from([11, 109, 227, 53, 179, 190, 88, 155]),
  releaseFunds: Buffer.from([225, 88, 91, 108, 126, 52, 2, 26]),
};

export type ChainStatus = "OPEN" | "FUNDED" | "SHIPPED" | "RELEASED" | "REFUNDED";

export type ChainTx = {
  id: string;
  type:
    | "fund_creator"
    | "fund_seller"
    | "fund_buyer"
    | "create_campaign"
    | "join"
    | "mark_shipped"
    | "confirm_delivery"
    | "release_funds";
  createdAt: string;
  note: string;
};

export type ChainSnapshot = {
  id: string;
  title: string;
  description: string;
  sellerName: string;
  targetBuyers: number;
  currentBuyers: number;
  depositSol: number;
  depositLamports: number;
  releaseRule: string;
  status: ChainStatus;
  network: string;
  programId: string;
  lifiEnabled: boolean;
  elevenLabsEnabled: boolean;
  confirmationsCount: number;
  totalDepositedSol: number;
  txHistory: ChainTx[];
  campaignPda: string;
  creator: string;
  seller: string;
  buyers: string[];
};

export type DemoPreflight = {
  backendOk: boolean;
  programId: string;
  rpcUrl: string;
  providerBalanceSol: number | null;
  campaignReachable: boolean;
  lifiMode: "fallback" | "live" | "missing_params";
  elevenLabsMode: "fallback" | "live" | "missing_env";
  warnings: string[];
};

type Runtime = {
  connection: any;
  payer: any;
  creator: any;
  seller: any;
  buyers: any[];
  campaignPda: any;
  contributionPdas: any[];
  initializedBuyers: number;
  confirmedBuyers: number;
  txHistory: ChainTx[];
};

let runtime: Runtime | null = null;
let initPromise: Promise<Runtime> | null = null;

function loadPayer(): any {
  const walletJson = process.env.ANCHOR_WALLET_JSON;
  if (walletJson && walletJson.trim().length > 0) {
    const secret = JSON.parse(walletJson);
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  }

  const walletPath = (process.env.ANCHOR_WALLET || "~/.config/solana/id.json").replace(
    "~",
    os.homedir()
  );
  try {
    const secret = JSON.parse(fs.readFileSync(walletPath, "utf8"));
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  } catch {
    throw new Error(
      "Solana wallet not configured. Set ANCHOR_WALLET_JSON env var with the keypair JSON array, " +
      "or ensure ANCHOR_WALLET points to a valid keypair file."
    );
  }
}

function findCampaignPda(creator: any): any {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), creator.publicKey.toBuffer()],
    PROGRAM_ID
  )[0];
}

function findContributionPda(campaign: any, buyer: any): any {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("contribution"), campaign.toBuffer(), buyer.publicKey.toBuffer()],
    PROGRAM_ID
  )[0];
}

function addTx(runtime: Runtime, type: ChainTx["type"], id: string, note: string) {
  runtime.txHistory.unshift({
    id,
    type,
    createdAt: new Date().toISOString(),
    note,
  });
}

async function send(runtime: Runtime, tx: any, signers: any[]): Promise<string> {
  return sendAndConfirmTransaction(runtime.connection, tx, signers, {
    commitment: "confirmed",
  });
}

async function fund(runtime: Runtime, to: any, lamports: number, type: ChainTx["type"]) {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: runtime.payer.publicKey,
      toPubkey: to,
      lamports,
    })
  );
  const sig = await send(runtime, tx, [runtime.payer]);
  addTx(runtime, type, sig, `Funded ${to.toBase58()} with ${lamports / LAMPORTS_PER_SOL} devnet SOL`);
}

function createCampaignIx(runtime: Runtime): any {
  const data = Buffer.alloc(8 + 32 + 1 + 8);
  DISCRIMINATORS.createCampaign.copy(data, 0);
  runtime.seller.publicKey.toBuffer().copy(data, 8);
  data.writeUInt8(TARGET_BUYERS, 40);
  data.writeBigUInt64LE(BigInt(DEPOSIT_LAMPORTS), 41);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: runtime.creator.publicKey, isSigner: true, isWritable: true },
      { pubkey: runtime.campaignPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

function joinIx(runtime: Runtime, buyerIndex: number): any {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: runtime.buyers[buyerIndex].publicKey, isSigner: true, isWritable: true },
      { pubkey: runtime.campaignPda, isSigner: false, isWritable: true },
      { pubkey: runtime.contributionPdas[buyerIndex], isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATORS.joinCampaign,
  });
}

function markShippedIx(runtime: Runtime): any {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: runtime.seller.publicKey, isSigner: true, isWritable: false },
      { pubkey: runtime.campaignPda, isSigner: false, isWritable: true },
    ],
    data: DISCRIMINATORS.markShipped,
  });
}

function confirmDeliveryIx(runtime: Runtime, buyerIndex: number): any {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: runtime.buyers[buyerIndex].publicKey, isSigner: true, isWritable: false },
      { pubkey: runtime.campaignPda, isSigner: false, isWritable: true },
      { pubkey: runtime.contributionPdas[buyerIndex], isSigner: false, isWritable: true },
    ],
    data: DISCRIMINATORS.confirmDelivery,
  });
}

function releaseFundsIx(runtime: Runtime): any {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: runtime.seller.publicKey, isSigner: true, isWritable: true },
      { pubkey: runtime.campaignPda, isSigner: false, isWritable: true },
    ],
    data: DISCRIMINATORS.releaseFunds,
  });
}

function decodeCampaign(data: Buffer): {
  currentBuyers: number;
  totalDeposited: number;
  confirmations: number;
  status: ChainStatus;
} {
  const currentBuyers = data.readUInt8(8 + 32 + 32 + 1);
  const totalDeposited = Number(data.readBigUInt64LE(8 + 32 + 32 + 1 + 1 + 8));
  const confirmations = data.readUInt8(8 + 32 + 32 + 1 + 1 + 8 + 8);
  const statusByte = data.readUInt8(8 + 32 + 32 + 1 + 1 + 8 + 8 + 1);
  const statusMap: ChainStatus[] = ["OPEN", "FUNDED", "SHIPPED", "RELEASED", "REFUNDED"];

  return {
    currentBuyers,
    totalDeposited,
    confirmations,
    status: statusMap[statusByte] ?? "OPEN",
  };
}

async function readCampaign(runtime: Runtime) {
  const account = await runtime.connection.getAccountInfo(runtime.campaignPda, "confirmed");
  if (!account) {
    throw new Error("Campaign account does not exist on devnet");
  }
  return decodeCampaign(account.data);
}

async function initializeRuntime(): Promise<Runtime> {
  const connection = new Connection(RPC_URL, "confirmed");
  const payer = loadPayer();
  const balance = await connection.getBalance(payer.publicKey, "confirmed");

  if (balance < MIN_PROVIDER_BALANCE) {
    throw new Error(
      `Provider wallet needs at least ${MIN_PROVIDER_BALANCE / LAMPORTS_PER_SOL} devnet SOL. Current balance: ${balance / LAMPORTS_PER_SOL} SOL`
    );
  }

  const creator = Keypair.fromSecretKey(Uint8Array.from([37,199,201,250,46,9,136,234,23,191,206,45,176,4,3,104,47,204,155,41,166,200,42,240,49,0,83,129,74,14,26,217,33,252,182,149,196,211,187,66,65,107,118,181,89,164,22,240,18,204,237,113,235,152,151,27,26,0,141,168,195,170,181,193]));
  const seller = Keypair.fromSecretKey(Uint8Array.from([187,8,172,208,207,67,161,30,232,138,41,176,26,56,128,223,212,11,190,247,198,214,37,240,1,92,162,35,84,224,36,2,8,174,151,92,80,128,164,69,23,136,10,16,38,220,158,211,83,218,248,8,181,157,216,15,104,226,101,42,204,230,155,81]));
  const buyers = [
    Keypair.fromSecretKey(Uint8Array.from([220,137,9,159,176,34,46,103,75,195,172,130,65,172,127,185,122,4,187,88,70,64,24,153,200,252,234,124,78,217,150,227,7,23,191,55,109,241,181,121,93,147,116,60,101,75,72,78,82,166,96,244,40,225,56,64,165,206,115,254,240,167,228,86])),
    Keypair.fromSecretKey(Uint8Array.from([105,218,246,76,61,44,193,37,77,39,112,113,47,226,237,173,50,255,63,135,233,118,201,34,86,248,238,66,224,29,52,48,149,250,209,118,183,123,217,93,39,49,151,142,33,101,204,212,226,156,237,3,6,215,4,7,41,116,252,17,110,122,167,87])),
    Keypair.fromSecretKey(Uint8Array.from([230,31,26,0,140,107,89,58,154,246,14,152,186,81,149,29,63,33,40,215,45,155,56,176,101,230,191,32,171,168,222,140,88,25,14,232,227,49,254,155,97,11,186,168,28,204,11,217,193,240,144,53,164,39,51,55,87,84,213,148,140,5,84,56]))
  ];
  const campaignPda = findCampaignPda(creator);
  const baseRuntime: Runtime = {
    connection,
    payer,
    creator,
    seller,
    buyers,
    campaignPda,
    contributionPdas: buyers.map((buyer) => findContributionPda(campaignPda, buyer)),
    initializedBuyers: 0,
    confirmedBuyers: 0,
    txHistory: [],
  };

  try {
    const existing = await readCampaign(baseRuntime);
    baseRuntime.initializedBuyers = existing.currentBuyers;
    baseRuntime.confirmedBuyers = existing.confirmations;
    addTx(baseRuntime, "create_campaign", "reused_pda", "Resumed devnet escrow campaign from chain");
  } catch (e) {
    await fund(baseRuntime, creator.publicKey, FUND_CREATOR, "fund_creator");
    await fund(baseRuntime, seller.publicKey, FUND_SELLER, "fund_seller");
    for (const buyer of buyers.slice(0, 2)) {
      await fund(baseRuntime, buyer.publicKey, FUND_BUYER, "fund_buyer");
    }

    const sigCreate = await send(
      baseRuntime,
      new Transaction().add(createCampaignIx(baseRuntime)),
      [creator]
    );
    addTx(baseRuntime, "create_campaign", sigCreate, "Created devnet escrow campaign");

    for (let i = 0; i < 2; i += 1) {
      const sigJoin = await send(baseRuntime, new Transaction().add(joinIx(baseRuntime, i)), [
        buyers[i],
      ]);
      baseRuntime.initializedBuyers += 1;
      addTx(baseRuntime, "join", sigJoin, `Buyer ${i + 1} deposited 0.05 devnet SOL`);
    }
  }

  return baseRuntime;
}

export async function ensureDevnetDemo(): Promise<Runtime> {
  if (runtime) return runtime;
  if (!initPromise) {
    initPromise = initializeRuntime()
      .then((nextRuntime) => {
        runtime = nextRuntime;
        return nextRuntime;
      })
      .finally(() => {
        initPromise = null;
      });
  }
  return initPromise;
}

export async function getDevnetCampaignSnapshot(): Promise<ChainSnapshot> {
  const rt = await ensureDevnetDemo();
  const chain = await readCampaign(rt);

  return {
    id: "campaign-rtx-5080-demo",
    title: "RTX 5080 Group Buy",
    description:
      "Real devnet SOL escrow campaign. Buyers deposit into the deployed Snowball Anchor program.",
    sellerName: "NovaTech Istanbul",
    targetBuyers: TARGET_BUYERS,
    currentBuyers: chain.currentBuyers,
    depositSol: DEPOSIT_LAMPORTS / LAMPORTS_PER_SOL,
    depositLamports: DEPOSIT_LAMPORTS,
    releaseRule: "2 of 3 delivery confirmations release funds to the seller",
    status: chain.status,
    network: "devnet",
    programId: PROGRAM_ID.toBase58(),
    lifiEnabled: true,
    elevenLabsEnabled: true,
    confirmationsCount: chain.confirmations,
    totalDepositedSol: Number((chain.totalDeposited / LAMPORTS_PER_SOL).toFixed(9)),
    txHistory: [...rt.txHistory],
    campaignPda: rt.campaignPda.toBase58(),
    creator: rt.creator.publicKey.toBase58(),
    seller: rt.seller.publicKey.toBase58(),
    buyers: rt.buyers.map((buyer) => buyer.publicKey.toBase58()),
  };
}

export async function joinDevnetCampaign() {
  const rt = await ensureDevnetDemo();
  const chain = await readCampaign(rt);
  if (chain.status !== "OPEN") throw new Error("Campaign is not open");
  const buyerIndex = rt.initializedBuyers;
  if (buyerIndex >= TARGET_BUYERS) throw new Error("Campaign is full");

  const buyer = rt.buyers[buyerIndex];
  const buyerBalance = await rt.connection.getBalance(buyer.publicKey, "confirmed");
  if (buyerBalance < FUND_BUYER) {
    await fund(rt, buyer.publicKey, FUND_BUYER, "fund_buyer");
  }

  const sig = await send(rt, new Transaction().add(joinIx(rt, buyerIndex)), [buyer]);
  rt.initializedBuyers += 1;
  addTx(rt, "join", sig, `Buyer ${buyerIndex + 1} deposited 0.05 devnet SOL`);
  return sig;
}

export async function markDevnetShipped() {
  const rt = await ensureDevnetDemo();
  const sig = await send(rt, new Transaction().add(markShippedIx(rt)), [rt.seller]);
  addTx(rt, "mark_shipped", sig, "Seller marked devnet campaign as shipped");
  return sig;
}

export async function confirmDevnetDelivery() {
  const rt = await ensureDevnetDemo();
  const buyerIndex = rt.confirmedBuyers;
  if (buyerIndex >= 2) throw new Error("Demo already has enough confirmations");
  const sig = await send(rt, new Transaction().add(confirmDeliveryIx(rt, buyerIndex)), [
    rt.buyers[buyerIndex],
  ]);
  rt.confirmedBuyers += 1;
  addTx(rt, "confirm_delivery", sig, `Buyer ${buyerIndex + 1} confirmed delivery on devnet`);
  return sig;
}

export async function releaseDevnetFunds() {
  const rt = await ensureDevnetDemo();
  const sig = await send(rt, new Transaction().add(releaseFundsIx(rt)), [rt.seller]);
  addTx(rt, "release_funds", sig, "Released real devnet escrow funds to seller");
  return sig;
}

export async function resetDevnetDemo() {
  runtime = null;
  initPromise = null;
  await ensureDevnetDemo();
}

export async function fundExternalWallet(address: string): Promise<string> {
  const rt = await ensureDevnetDemo();
  const to = new PublicKey(address);
  const lamports = 60_000_000;
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: rt.payer.publicKey,
      toPubkey: to,
      lamports,
    })
  );
  const sig = await send(rt, tx, [rt.payer]);
  addTx(rt, "fund_buyer", sig, `Funded connected wallet ${address} with 0.06 devnet SOL`);
  return sig;
}

export async function getDemoPreflight(): Promise<DemoPreflight> {
  const warnings: string[] = [];
  const connection = new Connection(RPC_URL, "confirmed");
  let providerBalanceSol: number | null = null;

  try {
    const payer = loadPayer();
    const balance = await connection.getBalance(payer.publicKey, "confirmed");
    providerBalanceSol = Number((balance / LAMPORTS_PER_SOL).toFixed(4));
    if (balance < 500_000_000) {
      warnings.push("Provider wallet below 0.5 SOL");
    }
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? `Provider wallet unavailable: ${error.message}`
        : "Provider wallet unavailable"
    );
  }

  let campaignReachable = false;
  if (runtime) {
    try {
      await readCampaign(runtime);
      campaignReachable = true;
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `Campaign account unavailable: ${error.message}`
          : "Campaign account unavailable"
      );
    }
  } else {
    warnings.push("Campaign not initialized yet; press Restart Demo or open the campaign endpoint");
  }

  const lifiMode = "live";
  const elevenLabsMode =
    process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID
      ? "live"
      : "missing_env";

  if (elevenLabsMode === "missing_env") {
    warnings.push("ElevenLabs credentials missing; AI voice/TTS uses fallback where available");
  }

  return {
    backendOk: true,
    programId: PROGRAM_ID.toBase58(),
    rpcUrl: RPC_URL,
    providerBalanceSol,
    campaignReachable,
    lifiMode,
    elevenLabsMode,
    warnings,
  };
}
