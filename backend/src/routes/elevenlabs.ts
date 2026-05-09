import { Router, Request, Response } from "express";

const router = Router();

const SUMMARY_TEXT =
  "This Snowball group buy is protected by a Solana escrow program. Each buyer deposits 0.05 devnet SOL. The seller cannot withdraw funds until at least two buyers confirm delivery.";

router.post("/summary-audio", async (_req: Request, res: Response) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  if (!apiKey || !voiceId) {
    return res.json({
      fallback: true,
      reason: "Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID",
      text: SUMMARY_TEXT,
    });
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
    voiceId
  )}?output_format=mp3_44100_128`;

  try {
    const ttsResponse = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: SUMMARY_TEXT,
        model_id: modelId,
      }),
    });

    if (!ttsResponse.ok) {
      return res.status(502).json({
        fallback: true,
        provider: "elevenlabs",
        error: "ElevenLabs TTS request failed",
        status: ttsResponse.status,
        text: SUMMARY_TEXT,
      });
    }

    const arrayBuffer = await ttsResponse.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Snowball-Audio-Provider", "elevenlabs");
    res.setHeader("X-Snowball-Fallback", "false");
    return res.send(audioBuffer);
  } catch (_err) {
    return res.status(502).json({
      fallback: true,
      provider: "elevenlabs",
      error: "ElevenLabs TTS request error",
      text: SUMMARY_TEXT,
    });
  }
});

export default router;
