import { Router, Request, Response } from "express";
import {
  confirmDemoDelivery,
  getDemoCampaign,
  joinDemoCampaign,
  markDemoCampaignShipped,
  releaseDemoFunds,
  resetDemoCampaign,
} from "../demoCampaign";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(getDemoCampaign());
});

router.post("/join", (_req: Request, res: Response) => {
  const result = joinDemoCampaign();
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/mark-shipped", (_req: Request, res: Response) => {
  const result = markDemoCampaignShipped();
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/confirm-delivery", (_req: Request, res: Response) => {
  const result = confirmDemoDelivery();
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/release", (_req: Request, res: Response) => {
  const result = releaseDemoFunds();
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/reset", (_req: Request, res: Response) => {
  res.json(resetDemoCampaign());
});

export default router;
