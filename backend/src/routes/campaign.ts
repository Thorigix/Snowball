import { Router, Request, Response } from "express";
import { getDemoCampaign } from "../demoCampaign";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(getDemoCampaign());
});

export default router;
