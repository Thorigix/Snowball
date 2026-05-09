import { BACKEND_URL } from "@/constants/config";
import type {
  Campaign,
  CampaignStatus,
  CampaignTx,
  DemoPreflight,
  LifiRouteSummary,
} from "@/types";

type BackendCampaign = {
  id: string;
  title: string;
  description: string;
  sellerName: string;
  targetBuyers: number;
  currentBuyers: number;
  depositSol: number;
  depositLamports: number;
  releaseRule: string;
  status: CampaignStatus;
  network: string;
  programId: string;
  lifiEnabled: boolean;
  elevenLabsEnabled: boolean;
  confirmationsCount?: number;
  totalDepositedSol?: number;
  campaignPda?: string;
  creator?: string;
  seller?: string;
  buyers?: string[];
  txHistory?: CampaignTx[];
};

type LifiQuoteRequest = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress?: string;
  toAddress?: string;
  slippage?: string;
};

function apiUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = 8000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || data?.error) {
      throw new Error(
        data?.error ?? `Backend ${path} failed with ${response.status}`
      );
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function mapBackendCampaign(campaign: BackendCampaign): Campaign {
  const pricePerUser = campaign.depositSol.toFixed(2);
  const totalRequiredAmount = (
    campaign.depositSol * campaign.targetBuyers
  ).toFixed(2);
  const totalDeposited = (
    campaign.totalDepositedSol ?? campaign.depositSol * campaign.currentBuyers
  ).toFixed(2);

  return {
    id: campaign.id,
    title: campaign.title,
    description: `${campaign.description} ${campaign.releaseRule}`,
    creatorWallet: "BACKEND_DEMO_CREATOR",
    sellerWallet: "BACKEND_DEMO_SELLER",
    sellerName: campaign.sellerName,
    targetParticipants: campaign.targetBuyers,
    currentParticipants: campaign.currentBuyers,
    pricePerUser,
    totalRequiredAmount,
    totalDeposited,
    tokenSymbol: "SOL",
    tokenMint: "SOL_NATIVE",
    status: campaign.status,
    deadline: "2026-05-12T23:59:00Z",
    deliveryDeadline: "2026-05-17T23:59:00Z",
    confirmationsCount: campaign.confirmationsCount ?? 0,
    disputesCount: 0,
    campaignPda: campaign.campaignPda,
    creator: campaign.creator,
    seller: campaign.seller,
    buyers: campaign.buyers,
    programId: campaign.programId,
    txHistory: campaign.txHistory ?? [],
  };
}

export async function fetchBackendCampaign(): Promise<Campaign> {
  const campaign = await requestJson<BackendCampaign>("/api/campaign");
  return mapBackendCampaign(campaign);
}

type BackendMutationResult = {
  success: boolean;
  txHash: string;
  campaign: BackendCampaign;
  error?: string;
};

export async function mutateBackendCampaign(
  action:
    | "join"
    | "mark-shipped"
    | "confirm-delivery"
    | "release"
    | "reset"
): Promise<{ success: boolean; txHash: string; campaign: Campaign; error?: string }> {
  const result = await requestJson<BackendMutationResult>(`/api/campaign/${action}`, {
    method: "POST",
  });

  return {
    success: result.success,
    txHash: result.txHash,
    campaign: mapBackendCampaign(result.campaign),
    error: result.error,
  };
}

export async function fetchLifiQuote(
  params: LifiQuoteRequest
): Promise<LifiRouteSummary> {
  const data = await requestJson<any>("/api/lifi/quote", {
    method: "POST",
    body: JSON.stringify(params),
  }, 15000);

  const estimate = data.estimate ?? {};
  const gasUsd = Array.isArray(estimate.gasCosts)
    ? estimate.gasCosts
        .reduce((total: number, item: any) => total + Number(item?.amountUsd ?? 0), 0)
        .toFixed(2)
    : "0";

  return {
    fromChain: params.fromChain,
    fromToken: params.fromToken,
    toChain: "solana",
    toToken: "SOL",
    estimatedGasUsd: gasUsd,
    estimatedTimeSeconds: estimate.executionDuration ?? 300,
    routeId: data.routeId ?? data.tool ?? "lifi-live-route",
    summary: `Bridge ${params.fromToken} to Solana SOL via ${data.tool ?? "LI.FI"}`,
    providerMode: "live",
    tool: data.tool,
    fromAmount: data.action?.fromAmount,
    toAmount: estimate.toAmount,
    fromTokenAddress: data.action?.fromToken?.address,
    approvalAddress: estimate.approvalAddress,
    transactionRequest: data.transactionRequest,
    requiredParams: {
      fromChain: params.fromChain,
      toChain: params.toChain,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      fromAddress: params.fromAddress ?? "",
      toAddress: params.toAddress ?? "",
    },
  };
}

export async function fetchDemoPreflight(): Promise<DemoPreflight> {
  return requestJson<DemoPreflight>("/api/demo/preflight", undefined, 5000);
}

export async function fetchElevenLabsSummary(): Promise<string> {
  const data = await requestJson<{ text?: string }>("/api/elevenlabs/summary-audio", {
    method: "POST",
  });

  return data.text ?? "Snowball escrow summary is unavailable.";
}

export async function fundConnectedWallet(address: string): Promise<string> {
  const result = await requestJson<{ success: boolean; txHash: string; error?: string }>(
    "/api/campaign/fund-wallet",
    {
      method: "POST",
      body: JSON.stringify({ address }),
    }
  );

  if (!result.success) {
    throw new Error(result.error ?? "Wallet funding failed");
  }

  return result.txHash;
}
