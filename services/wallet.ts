import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PROGRAM_ID, SOLANA_RPC_URL } from "@/constants/config";
import type { Campaign } from "@/types";

type BrowserWallet = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect?: () => Promise<void>;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
};

export type WalletSnapshot = {
  connected: boolean;
  address: string;
  providerName: string;
  balanceSol: number | null;
};

const JOIN_CAMPAIGN_DISCRIMINATOR = new Uint8Array([
  139, 142, 101, 28, 183, 90, 68, 4,
]);

const connection = new Connection(SOLANA_RPC_URL, "confirmed");
const textEncoder = new TextEncoder();

let walletProvider: BrowserWallet | null = null;
let snapshot: WalletSnapshot = {
  connected: false,
  address: "",
  providerName: "",
  balanceSol: null,
};
const listeners = new Set<() => void>();

function getBrowserWallet(): BrowserWallet | null {
  const anyGlobal = globalThis as any;
  const phantom = anyGlobal?.phantom?.solana;
  const solana = anyGlobal?.solana;
  const solflare = anyGlobal?.solflare;

  if (phantom?.isPhantom) return phantom;
  if (solana?.isPhantom || solana?.isSolflare) return solana;
  if (solflare?.isSolflare) return solflare;
  return null;
}

function hasMetaMaskOnly(): boolean {
  const anyGlobal = globalThis as any;
  return Boolean(anyGlobal?.ethereum?.isMetaMask);
}

export const PHANTOM_INSTALL_URL = "https://phantom.app/download";
export const SOLFLARE_INSTALL_URL = "https://solflare.com/download";

export function isNoSolanaWalletError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /No Solana browser wallet|Install Phantom or Solflare/i.test(error.message);
}

function providerName(provider: BrowserWallet): string {
  if (provider.isPhantom) return "Phantom";
  if (provider.isSolflare) return "Solflare";
  return "Solana Wallet";
}

function emit() {
  listeners.forEach((listener) => listener());
}

function getWalletErrorMessage(error: unknown): string {
  const fallback = "Wallet could not sign or send the deposit transaction.";
  if (error instanceof Error) {
    if (/unexpected error/i.test(error.message)) {
      return "Wallet returned an unexpected error. Check that your wallet is on Solana devnet and has at least 0.055 SOL for the real escrow deposit plus fees.";
    }
    return error.message;
  }

  const maybeMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";
  if (/unexpected error/i.test(maybeMessage)) {
    return "Wallet returned an unexpected error. Check that your wallet is on Solana devnet and has at least 0.055 SOL for the real escrow deposit plus fees.";
  }
  return maybeMessage || fallback;
}

export async function refreshWalletBalance(address = snapshot.address) {
  if (!address) return;
  try {
    const lamports = await connection.getBalance(new PublicKey(address), "confirmed");
    snapshot = { ...snapshot, balanceSol: lamports / 1_000_000_000 };
    emit();
  } catch {
    snapshot = { ...snapshot, balanceSol: null };
    emit();
  }
}

export function subscribeWallet(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWalletSnapshot(): WalletSnapshot {
  return snapshot;
}

export async function connectWallet(): Promise<WalletSnapshot> {
  const provider = getBrowserWallet();
  if (!provider) {
    if (hasMetaMaskOnly()) {
      throw new Error(
        "MetaMask is connected, but this demo signs Solana devnet transactions. Install Phantom or Solflare for Solana."
      );
    }
    throw new Error(
      "No Solana browser wallet found. Install Phantom or Solflare, then refresh this page."
    );
  }

  const response = await provider.connect();
  walletProvider = provider;
  snapshot = {
    connected: true,
    address: response.publicKey.toBase58(),
    providerName: providerName(provider),
    balanceSol: null,
  };
  emit();
  await refreshWalletBalance(snapshot.address);
  return snapshot;
}

export async function disconnectWallet(): Promise<void> {
  if (walletProvider?.disconnect) {
    await walletProvider.disconnect();
  }
  walletProvider = null;
  snapshot = {
    connected: false,
    address: "",
    providerName: "",
    balanceSol: null,
  };
  emit();
}

export async function joinCampaignWithWallet(campaign: Campaign): Promise<string> {
  const provider = walletProvider ?? getBrowserWallet();
  console.log("[Wallet] Starting join transaction", {
    provider: provider ? providerName(provider) : "none",
    campaignPda: campaign.campaignPda,
    status: campaign.status,
  });
  if (!provider) {
    throw new Error("Connect Phantom or Solflare first.");
  }

  if (!provider.publicKey && snapshot.address) {
    await provider.connect();
  }

  const publicKey = provider.publicKey ?? new PublicKey(snapshot.address);
  if (!publicKey) {
    throw new Error("Wallet is not connected.");
  }
  if (!campaign.campaignPda) {
    throw new Error("Campaign PDA is missing from backend response.");
  }

  const campaignPda = new PublicKey(campaign.campaignPda);
  const programId = new PublicKey(PROGRAM_ID);
  const [contributionPda] = PublicKey.findProgramAddressSync(
    [
      textEncoder.encode("contribution"),
      campaignPda.toBuffer(),
      publicKey.toBuffer(),
    ],
    programId
  );

  const tx = new Transaction().add(
    new TransactionInstruction({
      programId,
      keys: [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: campaignPda, isSigner: false, isWritable: true },
        { pubkey: contributionPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: JOIN_CAMPAIGN_DISCRIMINATOR as any,
    })
  );

  tx.feePayer = publicKey;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  let signature: string;
  try {
    if (provider.signAndSendTransaction) {
      console.log("[Wallet] Requesting signAndSendTransaction");
      const result = await provider.signAndSendTransaction(tx);
      signature = result.signature;
    } else if (provider.signTransaction) {
      console.log("[Wallet] Requesting signTransaction");
      const signed = await provider.signTransaction(tx);
      signature = await connection.sendRawTransaction(signed.serialize());
    } else {
      throw new Error("Wallet does not support transaction signing.");
    }
  } catch (error) {
    console.error("[Wallet] Sign/send failed", error);
    throw new Error(getWalletErrorMessage(error));
  }

  console.log("[Wallet] Transaction sent", signature);
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );
  await refreshWalletBalance(publicKey.toBase58());
  return signature;
}
