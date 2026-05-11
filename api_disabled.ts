import * as express from "express";
import * as cors from "cors";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ─── Inline route handlers (avoids cross-project TS import issues) ──────

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "snowball-backend", project: "Snowball" });
});

// Campaign — returns demo data (devnet escrow requires a wallet keypair)
app.get("/api/campaign", (_req, res) => {
  res.json({
    id: "campaign-rtx-5080-demo",
    title: "RTX 5080 Group Buy",
    description:
      "Join 3 buyers to unlock a discounted bulk price from NovaTech Istanbul. " +
      "Funds are locked in a Solana escrow program until delivery is confirmed.",
    sellerName: "NovaTech Istanbul",
    targetBuyers: 3,
    currentBuyers: 2,
    depositSol: 0.05,
    depositLamports: 50_000_000,
    releaseRule: "2 of 3 delivery confirmations release funds to the seller",
    status: "OPEN",
    network: "devnet",
    programId: "2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss",
    lifiEnabled: true,
    elevenLabsEnabled: true,
    confirmationsCount: 0,
    totalDepositedSol: 0.1,
    txHistory: [],
    campaignPda: "",
    creator: "",
    seller: "",
    buyers: [],
  });
});

// Demo preflight
app.get("/api/demo/preflight", (_req, res) => {
  res.json({
    backendOk: true,
    programId: "2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss",
    rpcUrl: "https://api.devnet.solana.com",
    providerBalanceSol: null,
    campaignReachable: false,
    lifiMode: "fallback",
    elevenLabsMode: "missing_env",
    warnings: [
      "Running on Vercel serverless — devnet wallet not configured.",
      "App uses local demo data for campaign state.",
    ],
  });
});

// Mutation stubs (join, ship, confirm, release, reset)
const mutationStub = (_req: express.Request, res: express.Response) => {
  res.status(503).json({
    success: false,
    error: "Devnet mutations require ANCHOR_WALLET_JSON env var. Configure it in Vercel dashboard.",
  });
};

app.post("/api/campaign/join", mutationStub);
app.post("/api/campaign/mark-shipped", mutationStub);
app.post("/api/campaign/confirm-delivery", mutationStub);
app.post("/api/campaign/release", mutationStub);
app.post("/api/campaign/reset", mutationStub);
app.post("/api/campaign/fund-wallet", mutationStub);

// LI.FI route stub
app.post("/api/lifi/quote", (_req, res) => {
  res.status(503).json({ error: "LI.FI bridge requires server-side configuration." });
});

// ElevenLabs stub
app.post("/api/elevenlabs/signed-url", (_req, res) => {
  res.status(503).json({ error: "ElevenLabs requires server-side API key." });
});

// Catch-all 404
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ─── Vercel handler ─────────────────────────────────────────────────────
export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as any)(req, res);
}
