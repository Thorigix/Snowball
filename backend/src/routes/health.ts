import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "snowball-backend",
    project: "Snowball",
  });
});

export default router;
