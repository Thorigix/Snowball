import { Router, Request, Response } from "express";

const router = Router();

const FALLBACK_ROUTE = {
  routeId: "lifi-demo-route",
  fromChain: "Base",
  fromToken: "USDC",
  toChain: "Solana",
  toToken: "SOL",
  estimatedTimeSeconds: 180,
  estimatedGasUsd: "2.10",
  summary:
    "LI.FI fallback route for cross-chain funding into the Snowball Solana escrow flow.",
  fallback: true,
};

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

router.post("/quote", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const fromChain = body.fromChain;
  const toChain = body.toChain;
  const fromToken = body.fromToken;
  const toToken = body.toToken;
  const fromAmount = body.fromAmount;
  const fromAddress = body.fromAddress;
  const toAddress = body.toAddress;
  const slippage = body.slippage;

  const hasRequiredLiveFields =
    hasValue(fromChain) &&
    hasValue(toChain) &&
    hasValue(fromToken) &&
    hasValue(toToken) &&
    hasValue(fromAmount) &&
    hasValue(fromAddress);

  if (!hasRequiredLiveFields) {
    return res.json({
      ...FALLBACK_ROUTE,
      reason: "Missing required quote parameters for live LI.FI quote",
    });
  }

  const integrator =
    process.env.LIFI_INTEGRATOR && process.env.LIFI_INTEGRATOR.trim().length > 0
      ? process.env.LIFI_INTEGRATOR
      : "snowball";

  const params = new URLSearchParams({
    fromChain: fromChain as string,
    toChain: toChain as string,
    fromToken: fromToken as string,
    toToken: toToken as string,
    fromAmount: fromAmount as string,
    fromAddress: fromAddress as string,
    slippage: hasValue(slippage) ? (slippage as string) : "0.005",
    integrator,
  });

  if (hasValue(toAddress)) {
    params.set("toAddress", toAddress as string);
  }

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
      return res.status(502).json({
        fallback: true,
        provider: "lifi",
        error: "LI.FI quote request failed",
        status: lifiResponse.status,
        summary: "Using fallback route because live LI.FI quote failed.",
      });
    }

    const quote = (await lifiResponse.json()) as Record<string, unknown>;

    const routeId =
      (quote.id as string | undefined) ||
      (quote.tool as string | undefined) ||
      "lifi-live-quote";

    return res.json({
      fallback: false,
      provider: "lifi",
      routeId,
      tool: quote.tool,
      action: quote.action,
      estimate: quote.estimate,
      transactionRequest: quote.transactionRequest,
      raw: quote,
    });
  } catch (_err) {
    return res.status(502).json({
      fallback: true,
      provider: "lifi",
      error: "LI.FI quote request error",
      summary: "Using fallback route because live LI.FI quote failed.",
    });
  }
});

export default router;
