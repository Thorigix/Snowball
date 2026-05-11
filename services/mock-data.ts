/**
 * Snowball — Mock Data Store
 *
 * Stateful, reactive in-memory store. Mutations (join, confirm, ship, release)
 * are visible across screens via subscribe(). The public API is preserved so
 * existing screens keep working; new hooks (use-mock-store) layer reactivity.
 */

import { Campaign, Contribution } from "@/types";
import {
  fetchBackendCampaign,
  mutateBackendCampaign,
} from "@/services/backend";

// ─── Initial Snapshots ──────────────────────────────────────────────
// Frozen blueprints used for resetDemoState(). The live store below is a
// deep clone of these.

const initialDemoCampaign: Campaign = {
  id: "campaign-rtx-5080-demo",
  title: "RTX 5080 Group Buy",
  description:
    "Join 3 buyers to unlock a discounted bulk price from NovaTech Istanbul. " +
    "Funds are locked in a Solana escrow program until delivery is confirmed.",
  imageUrl: undefined,
  creatorWallet: "CREATOR_WALLET_PLACEHOLDER",
  sellerWallet: "SELLER_WALLET_PLACEHOLDER",
  sellerName: "NovaTech Istanbul",
  targetParticipants: 3,
  currentParticipants: 3,
  pricePerUser: "0.05",
  totalRequiredAmount: "0.15",
  totalDeposited: "0.15",
  tokenSymbol: "SOL",
  tokenMint: "SOL_NATIVE",
  status: "FUNDED",
  deadline: "2026-05-12T23:59:00Z",
  deliveryDeadline: "2026-05-17T23:59:00Z",
  confirmationsCount: 0,
  disputesCount: 0,
};

const initialSecondCampaign: Campaign = {
  id: "campaign-airpods-demo",
  title: "AirPods Pro 3 Bulk Deal",
  description:
    "Group buy for AirPods Pro 3 at wholesale price. " +
    "Minimum 3 buyers needed. Escrow protects all participants.",
  imageUrl: undefined,
  creatorWallet: "CREATOR_WALLET_PLACEHOLDER",
  sellerWallet: "SELLER_WALLET_PLACEHOLDER_2",
  sellerName: "AudioMax Electronics",
  targetParticipants: 3,
  currentParticipants: 1,
  pricePerUser: "0.03",
  totalRequiredAmount: "0.09",
  totalDeposited: "0.03",
  tokenSymbol: "SOL",
  tokenMint: "SOL_NATIVE",
  status: "OPEN",
  deadline: "2026-05-15T23:59:00Z",
  deliveryDeadline: "2026-05-20T23:59:00Z",
  confirmationsCount: 0,
  disputesCount: 0,
};

const initialFundedCampaign: Campaign = {
  id: "campaign-keyboard-demo",
  title: "Mechanical Keyboard Group Buy",
  description:
    "Custom mechanical keyboards from KeyLab Studio. " +
    "Campaign is fully funded, waiting for shipment.",
  imageUrl: undefined,
  creatorWallet: "CREATOR_WALLET_PLACEHOLDER",
  sellerWallet: "SELLER_WALLET_PLACEHOLDER_3",
  sellerName: "KeyLab Studio",
  targetParticipants: 3,
  currentParticipants: 3,
  pricePerUser: "0.02",
  totalRequiredAmount: "0.06",
  totalDeposited: "0.06",
  tokenSymbol: "SOL",
  tokenMint: "SOL_NATIVE",
  status: "FUNDED",
  deadline: "2026-05-10T23:59:00Z",
  deliveryDeadline: "2026-05-14T23:59:00Z",
  confirmationsCount: 0,
  disputesCount: 0,
};

const initialPowerBankCampaign: Campaign = {
  id: "campaign-powerbank-demo",
  title: "Power Bank Mini Drop",
  description:
    "Low-cost demo campaign for compact power banks. " +
    "Buyers can test the Snowball escrow flow with a tiny devnet SOL deposit.",
  imageUrl: undefined,
  creatorWallet: "CREATOR_WALLET_PLACEHOLDER",
  sellerWallet: "SELLER_WALLET_PLACEHOLDER_4",
  sellerName: "ChargeHub Kadikoy",
  targetParticipants: 2,
  currentParticipants: 1,
  pricePerUser: "0.01",
  totalRequiredAmount: "0.02",
  totalDeposited: "0.01",
  tokenSymbol: "SOL",
  tokenMint: "SOL_NATIVE",
  status: "OPEN",
  deadline: "2026-05-16T23:59:00Z",
  deliveryDeadline: "2026-05-21T23:59:00Z",
  confirmationsCount: 0,
  disputesCount: 0,
};

const initialStickerPackCampaign: Campaign = {
  id: "campaign-sticker-pack-demo",
  title: "Dev Sticker Pack",
  description:
    "Tiny demo group buy for Snowball stickers. " +
    "Designed for showing campaign discovery without draining the demo wallet.",
  imageUrl: undefined,
  creatorWallet: "CREATOR_WALLET_PLACEHOLDER",
  sellerWallet: "SELLER_WALLET_PLACEHOLDER_5",
  sellerName: "HackLab Merch",
  targetParticipants: 2,
  currentParticipants: 0,
  pricePerUser: "0.005",
  totalRequiredAmount: "0.01",
  totalDeposited: "0",
  tokenSymbol: "SOL",
  tokenMint: "SOL_NATIVE",
  status: "OPEN",
  deadline: "2026-05-18T23:59:00Z",
  deliveryDeadline: "2026-05-23T23:59:00Z",
  confirmationsCount: 0,
  disputesCount: 0,
};

const INITIAL_CAMPAIGNS: Campaign[] = [
  initialDemoCampaign,
  initialSecondCampaign,
  initialFundedCampaign,
  initialPowerBankCampaign,
  initialStickerPackCampaign,
];

const INITIAL_CONTRIBUTIONS: Contribution[] = [
  {
    campaignId: "campaign-rtx-5080-demo",
    buyerWallet: "BUYER_1_PLACEHOLDER",
    amount: "0.05",
    hasConfirmedDelivery: false,
    hasRaisedDispute: false,
    refunded: false,
  },
  {
    campaignId: "campaign-rtx-5080-demo",
    buyerWallet: "BUYER_2_PLACEHOLDER",
    amount: "0.05",
    hasConfirmedDelivery: false,
    hasRaisedDispute: false,
    refunded: false,
  },
];

// ─── Live Store ─────────────────────────────────────────────────────
// `allCampaigns` and `demoContributions` are kept as named exports for
// backwards compatibility, but they are now references to the live arrays.
// Mutations replace array contents so existing readers see updates.

export const allCampaigns: Campaign[] = INITIAL_CAMPAIGNS.map((c) => ({ ...c }));
export const demoContributions: Contribution[] = INITIAL_CONTRIBUTIONS.map(
  (c) => ({ ...c })
);

// ─── Pub-sub ────────────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

function upsertCampaign(campaign: Campaign): void {
  const existingIndex = allCampaigns.findIndex((c) => c.id === campaign.id);
  if (existingIndex >= 0) {
    const userJoined = campaign.userJoined ?? allCampaigns[existingIndex].userJoined;
    Object.assign(allCampaigns[existingIndex], campaign, { userJoined });
  } else {
    allCampaigns.unshift({ ...campaign, userJoined: campaign.userJoined ?? false });
  }
}

function applyBackendCampaign(campaign: Campaign): Campaign {
  upsertCampaign(campaign);
  notify();
  return campaign;
}

// ─── Helpers ────────────────────────────────────────────────────────

function findCampaign(id: string): Campaign | undefined {
  return allCampaigns.find((c) => c.id === id);
}

function confirmationThreshold(target: number): number {
  // 2 of 3 (and roughly 2/3 majority for any size) — matches plan's release rule.
  return Math.max(1, Math.ceil(target * 0.66));
}

function fakeTxHash(prefix: string): string {
  return (
    "demo-" +
    prefix +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).substring(2, 8)
  );
}

async function joinLocalCampaign(campaignId: string): Promise<MutationResult> {
  await new Promise((r) => setTimeout(r, 700));
  const c = findCampaign(campaignId);
  if (!c) return { success: false, txHash: "", error: "Campaign not found" };
  if (c.userJoined) {
    return { success: false, txHash: "", error: "You already joined this campaign" };
  }
  if (c.status !== "OPEN") {
    return { success: false, txHash: "", error: "Campaign is not open" };
  }
  if (c.currentParticipants >= c.targetParticipants) {
    return { success: false, txHash: "", error: "Campaign is full" };
  }

  c.currentParticipants += 1;
  const precision = Math.max(2, c.pricePerUser.split(".")[1]?.length ?? 2);
  c.totalDeposited = (
    parseFloat(c.totalDeposited) + parseFloat(c.pricePerUser)
  ).toFixed(precision);

  demoContributions.push({
    campaignId: c.id,
    buyerWallet: "CURRENT_DEMO_USER",
    amount: c.pricePerUser,
    hasConfirmedDelivery: false,
    hasRaisedDispute: false,
    refunded: false,
  });

  if (c.currentParticipants >= c.targetParticipants) {
    c.status = "FUNDED";
  }

  c.userJoined = true;
  notify();
  return { success: true, txHash: fakeTxHash("join") };
}

export function markCampaignJoined(campaignId: string): void {
  const campaign = findCampaign(campaignId);
  if (!campaign) return;
  campaign.userJoined = true;
  notify();
}

// ─── Read APIs (kept stable for existing screens) ───────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  await refreshCampaignsFromBackend();
  return allCampaigns;
}

export async function getCampaignById(
  id: string
): Promise<Campaign | undefined> {
  await refreshCampaignsFromBackend();
  return findCampaign(id);
}

export async function refreshCampaignsFromBackend(): Promise<void> {
  try {
    const campaign = await fetchBackendCampaign();
    upsertCampaign(campaign);
    notify();
  } catch (error) {
    console.warn("[Backend] Campaign sync failed, using local demo data", error);
  }
}

// ─── AI Summaries (mock fallback) ───────────────────────────────────

export async function getAiCampaignSummary(
  campaignId: string
): Promise<string> {
  await new Promise((r) => setTimeout(r, 500));
  const campaign = findCampaign(campaignId);
  if (!campaign) return "Campaign not found.";

  return (
    `This group buy is ${campaign.currentParticipants} out of ${campaign.targetParticipants} funded. ` +
    `Each buyer deposits ${campaign.pricePerUser} devnet SOL into a Solana escrow program. ` +
    `The seller cannot withdraw funds until at least ${confirmationThreshold(
      campaign.targetParticipants
    )} ` +
    `buyers confirm delivery.`
  );
}

export async function getAiRiskSummary(): Promise<{
  riskLevel: string;
  summary: string;
}> {
  await new Promise((r) => setTimeout(r, 500));
  return {
    riskLevel: "medium",
    summary:
      "The offer is below the market average, so buyers should wait for delivery confirmation " +
      "before releasing funds. The escrow contract prevents direct seller withdrawal.",
  };
}

// ─── State Mutations ────────────────────────────────────────────────

export type MutationResult = {
  success: boolean;
  txHash: string;
  error?: string;
};

export async function mockJoinCampaign(
  campaignId: string
): Promise<MutationResult> {
  const campaign = findCampaign(campaignId);
  if (campaign?.userJoined) {
    return { success: false, txHash: "", error: "You already joined this campaign" };
  }
  if (campaign && !campaign.campaignPda) {
    return joinLocalCampaign(campaignId);
  }

  try {
    const result = await mutateBackendCampaign("join");
    applyBackendCampaign(result.campaign);
    markCampaignJoined(result.campaign.id);
    return {
      success: result.success,
      txHash: result.txHash,
      error: result.error,
    };
  } catch (error) {
    console.error("[Backend] Join failed", error);
    return {
      success: false,
      txHash: "",
      error: error instanceof Error ? error.message : "Devnet join failed",
    };
  }
}

export async function mockMarkShipped(
  _campaignId: string
): Promise<MutationResult> {
  try {
    const result = await mutateBackendCampaign("mark-shipped");
    applyBackendCampaign(result.campaign);
    return {
      success: result.success,
      txHash: result.txHash,
      error: result.error,
    };
  } catch (error) {
    console.error("[Backend] Mark shipped failed", error);
    return {
      success: false,
      txHash: "",
      error: error instanceof Error ? error.message : "Devnet mark shipped failed",
    };
  }
}

export async function mockConfirmDelivery(
  _campaignId: string
): Promise<MutationResult> {
  try {
    const result = await mutateBackendCampaign("confirm-delivery");
    applyBackendCampaign(result.campaign);
    return {
      success: result.success,
      txHash: result.txHash,
      error: result.error,
    };
  } catch (error) {
    console.error("[Backend] Confirm delivery failed", error);
    return {
      success: false,
      txHash: "",
      error:
        error instanceof Error ? error.message : "Devnet delivery confirmation failed",
    };
  }
}

export async function mockReleaseFunds(
  _campaignId: string
): Promise<MutationResult> {
  const campaign = findCampaign(_campaignId);
  if (campaign?.disputesCount) {
    return {
      success: false,
      txHash: "",
      error: "Release blocked: an open buyer dispute must be refunded or resolved first.",
    };
  }

  try {
    const result = await mutateBackendCampaign("release");
    applyBackendCampaign(result.campaign);
    return {
      success: result.success,
      txHash: result.txHash,
      error: result.error,
    };
  } catch (error) {
    console.error("[Backend] Release failed", error);
    return {
      success: false,
      txHash: "",
      error: error instanceof Error ? error.message : "Devnet release failed",
    };
  }
}

export async function mockRaiseDispute(
  campaignId: string
): Promise<MutationResult> {
  await new Promise((r) => setTimeout(r, 500));
  const c = findCampaign(campaignId);
  if (!c) return { success: false, txHash: "", error: "Campaign not found" };
  if (!["FUNDED", "SHIPPED", "DELIVERY_REVIEW"].includes(c.status)) {
    return {
      success: false,
      txHash: "",
      error: "Disputes can be raised after funds are locked and before release.",
    };
  }

  c.status = "DISPUTED";
  c.disputesCount = Math.max(1, c.disputesCount + 1);
  const txHash = fakeTxHash("raise-dispute");
  c.txHistory = [
    {
      id: txHash,
      type: "raise_dispute",
      createdAt: new Date().toISOString(),
      note: "Buyer raised a dispute; seller release is blocked in demo state",
    },
    ...(c.txHistory ?? []),
  ];
  notify();
  return { success: true, txHash };
}

export async function mockRefundBuyer(
  campaignId: string
): Promise<MutationResult> {
  await new Promise((r) => setTimeout(r, 500));
  const c = findCampaign(campaignId);
  if (!c) return { success: false, txHash: "", error: "Campaign not found" };
  if (c.status !== "DISPUTED") {
    return { success: false, txHash: "", error: "Refund path requires an open dispute." };
  }

  const precision = Math.max(2, c.pricePerUser.split(".")[1]?.length ?? 2);
  c.totalDeposited = Math.max(
    0,
    parseFloat(c.totalDeposited) - parseFloat(c.pricePerUser)
  ).toFixed(precision);
  c.currentParticipants = Math.max(0, c.currentParticipants - 1);
  c.status = "REFUNDED";
  c.disputesCount = 0;
  const contribution = demoContributions.find((item) => item.campaignId === c.id);
  if (contribution) contribution.refunded = true;

  const txHash = fakeTxHash("refund-buyer");
  c.txHistory = [
    {
      id: txHash,
      type: "refund_buyer",
      createdAt: new Date().toISOString(),
      note: `${c.pricePerUser} ${c.tokenSymbol} buyer refund recorded in demo state`,
    },
    ...(c.txHistory ?? []),
  ];
  notify();
  return { success: true, txHash };
}

function applyLocalReset(): void {
  INITIAL_CAMPAIGNS.forEach((seed, i) => {
    if (allCampaigns[i]) Object.assign(allCampaigns[i], { ...seed, userJoined: false });
    else allCampaigns[i] = { ...seed, userJoined: false };
  });
  allCampaigns.length = INITIAL_CAMPAIGNS.length;
  demoContributions.length = 0;
  INITIAL_CONTRIBUTIONS.forEach((c) => demoContributions.push({ ...c }));
}

export async function resetDemoState(): Promise<void> {
  try {
    const result = await mutateBackendCampaign("reset");
    applyLocalReset();
    applyBackendCampaign({ ...result.campaign, userJoined: false });
  } catch (error) {
    console.error("[Backend] Reset failed", error);
    applyLocalReset();
    notify();
    throw error;
  }
}

export function getConfirmationThreshold(target: number): number {
  return confirmationThreshold(target);
}
