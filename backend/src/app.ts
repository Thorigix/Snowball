import "dotenv/config";
import express from "express";
import cors from "cors";

import healthRouter from "./routes/health";
import campaignRouter from "./routes/campaign";
import lifiRouter from "./routes/lifi";
import elevenLabsRouter from "./routes/elevenlabs";
import demoRouter from "./routes/demo";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/campaign", campaignRouter);
app.use("/api/lifi", lifiRouter);
app.use("/api/elevenlabs", elevenLabsRouter);
app.use("/api/demo", demoRouter);

export default app;
