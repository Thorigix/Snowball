/**
 * Snowball Shared Types
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AgentConfig {
  agentId: string;
  name?: string;
  description?: string;
}

export interface VoiceState {
  isSpeaking: boolean;
  isListening: boolean;
  status: 'idle' | 'connecting' | 'connected' | 'error';
}

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
  userJoined?: boolean;
  campaignPda?: string;
  creator?: string;
  seller?: string;
  buyers?: string[];
  programId?: string;
  txHistory?: CampaignTx[];
};

export type CampaignTx = {
  id: string;
  type:
    | "fund_creator"
    | "fund_seller"
    | "fund_buyer"
    | "create_campaign"
    | "join"
    | "mark_shipped"
    | "confirm_delivery"
    | "release_funds"
    | "raise_dispute"
    | "refund_buyer";
  createdAt: string;
  note: string;
};

export type Contribution = {
  campaignId: string;
  buyerWallet: string;
  amount: string;
  hasConfirmedDelivery: boolean;
  hasRaisedDispute: boolean;
  refunded: boolean;
};

export type LifiRouteSummary = {
  fromChain: string;
  fromToken: string;
  toChain: "solana";
  toToken: "SOL" | "USDC";
  estimatedGasUsd: string;
  estimatedTimeSeconds: number;
  routeId: string;
  summary?: string;
  providerMode?: "live" | "fallback" | "missing_params";
  requiredParams?: Record<string, string>;
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
