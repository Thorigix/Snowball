import { Router, Request, Response } from "express";

const router = Router();

router.post("/quote", (_req: Request, res: Response) => {
  res.json({
    routeId: "lifi-demo-route",
    fromChain: "Base",
    fromToken: "USDC",
    toChain: "Solana",
    toToken: "SOL",
    estimatedTimeSeconds: 180,
    estimatedGasUsd: "2.10",
    summary:
      "LI.FI route placeholder for cross-chain funding into the Snowball Solana escrow flow.",
    fallback: true,
  });
});

export default router;
