/**
 * Snowball — Mock Data Store
 *
 * Stateful, reactive in-memory store. Mutations (join, confirm, ship, release)
 * are visible across screens via subscribe(). The public API is preserved so
 * existing screens keep working; new hooks (use-mock-store) layer reactivity.
 */

import { Campaign, Contribution, LifiRouteSummary } from "@/types";

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
  currentParticipants: 2,
  pricePerUser: "0.05",
  totalRequiredAmount: "0.15",
  totalDeposited: "0.10",
  tokenSymbol: "SOL",
  tokenMint: "SOL_NATIVE",
  status: "OPEN",
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

const INITIAL_CAMPAIGNS: Campaign[] = [
  initialDemoCampaign,
  initialSecondCampaign,
  initialFundedCampaign,
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
    "5mock" +
    Math.random().toString(36).substring(2, 10) +
    prefix +
    Math.random().toString(36).substring(2, 6)
  );
}

// ─── Read APIs (kept stable for existing screens) ───────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  await new Promise((r) => setTimeout(r, 400));
  return allCampaigns;
}

export async function getCampaignById(
  id: string
): Promise<Campaign | undefined> {
  await new Promise((r) => setTimeout(r, 300));
  return findCampaign(id);
}

// ─── LI.FI Mock ─────────────────────────────────────────────────────

export const mockLifiRoute: LifiRouteSummary = {
  fromChain: "Base",
  fromToken: "USDC",
  toChain: "solana",
  toToken: "SOL",
  estimatedGasUsd: "2.14",
  estimatedTimeSeconds: 180,
  routeId: "route_demo_123",
  summary: "Bridge 500 USDC from Base → Solana SOL via LI.FI",
};

export async function getLifiQuoteMock(): Promise<LifiRouteSummary> {
  await new Promise((r) => setTimeout(r, 800));
  return mockLifiRoute;
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
  await new Promise((r) => setTimeout(r, 1000));
  const c = findCampaign(campaignId);
  if (!c) return { success: false, txHash: "", error: "Campaign not found" };
  if (c.status !== "OPEN")
    return { success: false, txHash: "", error: "Campaign is not open" };
  if (c.currentParticipants >= c.targetParticipants)
    return { success: false, txHash: "", error: "Campaign is full" };

  c.currentParticipants += 1;
  const price = parseFloat(c.pricePerUser);
  c.totalDeposited = (parseFloat(c.totalDeposited) + price).toFixed(
    Math.max(2, c.pricePerUser.split(".")[1]?.length ?? 2)
  );

  demoContributions.push({
    campaignId: c.id,
    buyerWallet: `BUYER_${demoContributions.length + 1}_PLACEHOLDER`,
    amount: c.pricePerUser,
    hasConfirmedDelivery: false,
    hasRaisedDispute: false,
    refunded: false,
  });

  if (c.currentParticipants >= c.targetParticipants) {
    c.status = "FUNDED";
  }

  notify();
  return { success: true, txHash: fakeTxHash("join") };
}

export async function mockMarkShipped(
  campaignId: string
): Promise<MutationResult> {
  await new Promise((r) => setTimeout(r, 600));
  const c = findCampaign(campaignId);
  if (!c) return { success: false, txHash: "", error: "Campaign not found" };
  if (c.status !== "FUNDED")
    return { success: false, txHash: "", error: "Campaign is not funded" };

  c.status = "SHIPPED";
  notify();
  return { success: true, txHash: fakeTxHash("ship") };
}

export async function mockConfirmDelivery(
  campaignId: string
): Promise<MutationResult> {
  await new Promise((r) => setTimeout(r, 800));
  const c = findCampaign(campaignId);
  if (!c) return { success: false, txHash: "", error: "Campaign not found" };
  if (c.status !== "SHIPPED" && c.status !== "DELIVERY_REVIEW")
    return {
      success: false,
      txHash: "",
      error: "Campaign is not awaiting delivery confirmation",
    };

  c.confirmationsCount += 1;
  if (c.status === "SHIPPED") c.status = "DELIVERY_REVIEW";

  // Mark a contribution as confirmed (first unconfirmed for this campaign).
  const contrib = demoContributions.find(
    (x) => x.campaignId === c.id && !x.hasConfirmedDelivery
  );
  if (contrib) contrib.hasConfirmedDelivery = true;

  notify();
  return { success: true, txHash: fakeTxHash("confirm") };
}

export async function mockReleaseFunds(
  campaignId: string
): Promise<MutationResult> {
  await new Promise((r) => setTimeout(r, 700));
  const c = findCampaign(campaignId);
  if (!c) return { success: false, txHash: "", error: "Campaign not found" };
  if (c.status !== "DELIVERY_REVIEW" && c.status !== "SHIPPED")
    return {
      success: false,
      txHash: "",
      error: "Campaign is not in a releasable state",
    };
  if (c.confirmationsCount < confirmationThreshold(c.targetParticipants))
    return {
      success: false,
      txHash: "",
      error: `Need at least ${confirmationThreshold(
        c.targetParticipants
      )} confirmations`,
    };
  if (c.disputesCount > 0)
    return { success: false, txHash: "", error: "Active dispute blocks release" };

  c.status = "RELEASED";
  notify();
  return { success: true, txHash: fakeTxHash("release") };
}

export function resetDemoState(): void {
  // Mutate each campaign in place so existing references stay valid.
  INITIAL_CAMPAIGNS.forEach((seed, i) => {
    if (allCampaigns[i]) Object.assign(allCampaigns[i], seed);
    else allCampaigns[i] = { ...seed };
  });
  allCampaigns.length = INITIAL_CAMPAIGNS.length;

  demoContributions.length = 0;
  INITIAL_CONTRIBUTIONS.forEach((c) => demoContributions.push({ ...c }));
  notify();
}

export function getConfirmationThreshold(target: number): number {
  return confirmationThreshold(target);
}
