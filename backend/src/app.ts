try { require("dotenv/config"); } catch { /* Vercel injects env vars natively */ }
import cors from "cors";
import express from "express";

import campaignRouter from "./routes/campaign";
import demoRouter from "./routes/demo";
import elevenLabsRouter from "./routes/elevenlabs";
import healthRouter from "./routes/health";
import lifiRouter from "./routes/lifi";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/campaign", campaignRouter);
app.use("/api/lifi", lifiRouter);
app.use("/api/elevenlabs", elevenLabsRouter);
app.use("/api/demo", demoRouter);

app.use("/health", healthRouter);
app.use("/campaign", campaignRouter);
app.use("/lifi", lifiRouter);
app.use("/elevenlabs", elevenLabsRouter);
app.use("/demo", demoRouter);

export default app;
