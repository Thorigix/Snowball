import { Router, Request, Response } from "express";

import { getDemoPreflight } from "../devnetEscrow";

const router = Router();

router.get("/preflight", async (_req: Request, res: Response) => {
  try {
    res.json(await getDemoPreflight());
  } catch (error) {
    res.status(503).json({
      backendOk: false,
      programId: "2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss",
      rpcUrl: process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
      providerBalanceSol: null,
      campaignReachable: false,
      lifiMode: process.env.LIFI_API_KEY ? "live" : "fallback",
      elevenLabsMode:
        process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID
          ? "live"
          : "missing_env",
      warnings: [
        error instanceof Error ? error.message : "Demo preflight unavailable",
      ],
    });
  }
});

export default router;
