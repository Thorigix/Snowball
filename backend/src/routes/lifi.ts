import { Router, Request, Response } from "express";

const router = Router();

const SOLANA_CHAIN_ID = "1151111081099710";
const SOL_TOKEN_ADDRESS = "11111111111111111111111111111111";
const NATIVE_EVM_TOKEN = "0x0000000000000000000000000000000000000000";

const CHAIN_IDS: Record<string, string> = {
  ethereum: "1",
  eth: "1",
  base: "8453",
  polygon: "137",
  arbitrum: "42161",
  optimism: "10",
  solana: SOLANA_CHAIN_ID,
  sol: SOLANA_CHAIN_ID,
};

const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  "1": {
    ETH: NATIVE_EVM_TOKEN,
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  "8453": {
    ETH: NATIVE_EVM_TOKEN,
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  "137": {
    MATIC: NATIVE_EVM_TOKEN,
    POL: NATIVE_EVM_TOKEN,
    USDC: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  },
  "42161": {
    ETH: NATIVE_EVM_TOKEN,
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  },
  "10": {
    ETH: NATIVE_EVM_TOKEN,
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  },
};

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeChain(value: unknown): string | null {
  if (!hasValue(value)) return null;
  const raw = value.trim();
  if (/^\d+$/.test(raw)) return raw;
  return CHAIN_IDS[raw.toLowerCase()] ?? null;
}

function normalizeToken(chainId: string, value: unknown): string | null {
  if (!hasValue(value)) return null;
  const raw = value.trim();
  if (chainId === SOLANA_CHAIN_ID && raw.toUpperCase() === "SOL") {
    return SOL_TOKEN_ADDRESS;
  }
  if (raw.startsWith("0x") || raw === SOL_TOKEN_ADDRESS) return raw;
  return TOKEN_ADDRESSES[chainId]?.[raw.toUpperCase()] ?? null;
}

function errorResponse(res: Response, status: number, message: string, details?: unknown) {
  return res.status(status).json({
    provider: "lifi",
    error: message,
    details,
  });
}

router.post("/quote", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const fromChain = normalizeChain(body.fromChain);
  const toChain = normalizeChain(body.toChain);
  const fromToken = fromChain ? normalizeToken(fromChain, body.fromToken) : null;
  const toToken = toChain ? normalizeToken(toChain, body.toToken) : null;
  const fromAmount = body.fromAmount;
  const fromAddress = body.fromAddress;
  const toAddress = body.toAddress;
  const slippage = body.slippage;

  const missing = [
    !fromChain && "fromChain",
    !toChain && "toChain",
    !fromToken && "fromToken",
    !toToken && "toToken",
    !hasValue(fromAmount) && "fromAmount",
    !hasValue(fromAddress) && "fromAddress",
    !hasValue(toAddress) && "toAddress",
  ].filter(Boolean);

  if (missing.length > 0) {
    return errorResponse(res, 400, "Missing or unsupported LI.FI quote parameters", {
      missing,
      supportedChains: CHAIN_IDS,
      supportedTokens: TOKEN_ADDRESSES,
    });
  }

  const liveFromChain = fromChain as string;
  const liveToChain = toChain as string;
  const liveFromToken = fromToken as string;
  const liveToToken = toToken as string;

  const integrator =
    process.env.LIFI_INTEGRATOR && process.env.LIFI_INTEGRATOR.trim().length > 0
      ? process.env.LIFI_INTEGRATOR
      : "snowball";

  const params = new URLSearchParams({
    fromChain: liveFromChain,
    toChain: liveToChain,
    fromToken: liveFromToken,
    toToken: liveToToken,
    fromAmount: fromAmount as string,
    fromAddress: fromAddress as string,
    toAddress: toAddress as string,
    slippage: hasValue(slippage) ? (slippage as string) : "0.005",
    integrator,
  });

  const url = `https://li.quest/v1/quote?${params.toString()}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const apiKey = process.env.LIFI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    headers["x-lifi-api-key"] = apiKey;
  }

  try {
    const lifiResponse = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!lifiResponse.ok) {
      const details = await lifiResponse.json().catch(() => null);
      return errorResponse(res, 502, "LI.FI quote request failed", {
        status: lifiResponse.status,
        details,
      });
    }

    const quote = (await lifiResponse.json()) as Record<string, unknown>;

    const routeId =
      (quote.id as string | undefined) ||
      (quote.tool as string | undefined) ||
      "lifi-live-quote";

    return res.json({
      provider: "lifi",
      routeId,
      fromChain: liveFromChain,
      toChain: liveToChain,
      fromToken: liveFromToken,
      toToken: liveToToken,
      tool: quote.tool,
      action: quote.action,
      estimate: quote.estimate,
      transactionRequest: quote.transactionRequest,
      raw: quote,
    });
  } catch (err) {
    return errorResponse(res, 502, "LI.FI quote request error", {
      message: err instanceof Error ? err.message : "Unknown LI.FI error",
    });
  }
});

export default router;
