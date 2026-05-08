/**
 * Snowball — Mock Data
 * B kişisi backend olmadan tüm UI'ı bu mock data ile geliştirir.
 */

import { Campaign, Contribution, LifiRouteSummary } from "@/types";

// ─── Demo Campaign ───────────────────────────────────────────────────
export const demoCampaign: Campaign = {
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

export const secondCampaign: Campaign = {
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

export const fundedCampaign: Campaign = {
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

export const allCampaigns: Campaign[] = [
  demoCampaign,
  secondCampaign,
  fundedCampaign,
];

// ─── Demo Contributions ──────────────────────────────────────────────
export const demoContributions: Contribution[] = [
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

// ─── LI.FI Mock Route ───────────────────────────────────────────────
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

// ─── Mock Services ───────────────────────────────────────────────────
export async function getCampaigns(): Promise<Campaign[]> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 600));
  return allCampaigns;
}

export async function getCampaignById(
  id: string
): Promise<Campaign | undefined> {
  await new Promise((r) => setTimeout(r, 400));
  return allCampaigns.find((c) => c.id === id);
}

export async function getLifiQuoteMock(): Promise<LifiRouteSummary> {
  await new Promise((r) => setTimeout(r, 800));
  return mockLifiRoute;
}

export async function getAiCampaignSummary(
  campaignId: string
): Promise<string> {
  await new Promise((r) => setTimeout(r, 500));
  const campaign = allCampaigns.find((c) => c.id === campaignId);
  if (!campaign) return "Campaign not found.";

  return (
    `This group buy is ${campaign.currentParticipants} out of ${campaign.targetParticipants} funded. ` +
    `Each buyer deposits ${campaign.pricePerUser} devnet SOL into a Solana escrow program. ` +
    `The seller cannot withdraw funds until at least ${Math.ceil(campaign.targetParticipants * 0.66)} ` +
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

export async function mockJoinCampaign(
  _campaignId: string
): Promise<{ success: boolean; txHash: string }> {
  await new Promise((r) => setTimeout(r, 1200));
  return {
    success: true,
    txHash: "5mock" + Math.random().toString(36).substring(2, 15) + "tx",
  };
}

export async function mockConfirmDelivery(
  _campaignId: string
): Promise<{ success: boolean; txHash: string }> {
  await new Promise((r) => setTimeout(r, 1000));
  return {
    success: true,
    txHash: "5mock" + Math.random().toString(36).substring(2, 15) + "confirm",
  };
}
