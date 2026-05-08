/**
 * Snowball — Shared Types
 * A ve B kişileri arasındaki ortak sözleşme.
 */

export type CampaignStatus =
  | "DRAFT"
  | "OPEN"
  | "FUNDED"
  | "SHIPPED"
  | "DELIVERY_REVIEW"
  | "DISPUTED"
  | "RELEASED"
  | "REFUNDED"
  | "CANCELLED";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  creatorWallet: string;
  sellerWallet: string;
  sellerName: string;
  targetParticipants: number;
  currentParticipants: number;
  pricePerUser: string;
  totalRequiredAmount: string;
  totalDeposited: string;
  tokenSymbol: "USDC" | "SOL";
  tokenMint: string;
  status: CampaignStatus;
  deadline: string;
  deliveryDeadline?: string;
  confirmationsCount: number;
  disputesCount: number;
};

export type Contribution = {
  campaignId: string;
  buyerWallet: string;
  amount: string;
  hasConfirmedDelivery: boolean;
  hasRaisedDispute: boolean;
  refunded: boolean;
};

export type SellerOffer = {
  campaignId: string;
  sellerWallet: string;
  sellerName: string;
  proposedTotalPrice: string;
  deliveryDays: number;
  accepted: boolean;
};

export type LifiRouteSummary = {
  fromChain: string;
  fromToken: string;
  toChain: "solana";
  toToken: "USDC" | "SOL";
  estimatedGasUsd: string;
  estimatedTimeSeconds: number;
  routeId: string;
  summary?: string;
};

export type AiSummaryResponse = {
  summary: string;
};

export type AiRiskResponse = {
  riskLevel: "low" | "medium" | "high";
  summary: string;
};
