import "dotenv/config";
import express from "express";
import cors from "cors";

import healthRouter from "./routes/health";
import campaignRouter from "./routes/campaign";
import lifiRouter from "./routes/lifi";
import elevenLabsRouter from "./routes/elevenlabs";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/campaign", campaignRouter);
app.use("/api/lifi", lifiRouter);
app.use("/api/elevenlabs", elevenLabsRouter);

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`Snowball backend listening on port ${port}`);
});
