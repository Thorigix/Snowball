import { Router, Request, Response } from "express";

const router = Router();

router.post("/summary-audio", (_req: Request, res: Response) => {
  res.json({
    fallback: true,
    text:
      "This Snowball group buy is protected by a Solana escrow program. Each buyer deposits 0.05 devnet SOL. The seller cannot withdraw funds until at least two buyers confirm delivery.",
  });
});

export default router;
