import { Router, Request, Response } from "express";
import {
  confirmDevnetDelivery,
  fundExternalWallet,
  getDevnetCampaignSnapshot,
  joinDevnetCampaign,
  markDevnetShipped,
  releaseDevnetFunds,
  resetDevnetDemo,
} from "../devnetEscrow";

const router = Router();

async function handleMutation(
  res: Response,
  action: () => Promise<string | void>
) {
  try {
    const txHash = await action();
    const campaign = await getDevnetCampaignSnapshot();
    res.json({
      success: true,
      txHash: txHash ?? campaign.txHistory[0]?.id ?? "",
      campaign,
    });
  } catch (error) {
    const campaign = await getDevnetCampaignSnapshot().catch(() => null);
    res.status(400).json({
      success: false,
      txHash: "",
      campaign,
      error: error instanceof Error ? error.message : "Devnet transaction failed",
    });
  }
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json(await getDevnetCampaignSnapshot());
  } catch (error) {
    res.status(503).json({
      error: error instanceof Error ? error.message : "Devnet campaign unavailable",
    });
  }
});

router.post("/join", async (_req: Request, res: Response) => {
  await handleMutation(res, joinDevnetCampaign);
});

router.post("/mark-shipped", async (_req: Request, res: Response) => {
  await handleMutation(res, markDevnetShipped);
});

router.post("/confirm-delivery", async (_req: Request, res: Response) => {
  await handleMutation(res, confirmDevnetDelivery);
});

router.post("/release", async (_req: Request, res: Response) => {
  await handleMutation(res, releaseDevnetFunds);
});

router.post("/reset", async (_req: Request, res: Response) => {
  await handleMutation(res, async () => {
    await resetDevnetDemo();
  });
});

router.post("/fund-wallet", async (req: Request, res: Response) => {
  try {
    const address = req.body?.address;
    if (typeof address !== "string" || address.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Missing wallet address" });
    }
    const txHash = await fundExternalWallet(address);
    const campaign = await getDevnetCampaignSnapshot();
    return res.json({ success: true, txHash, campaign });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Wallet funding failed",
    });
  }
});

export default router;
