# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (choose platform interactively)
npm run android    # Launch on Android emulator
npm run ios        # Launch on iOS simulator
npm run web        # Launch in browser
npm run lint       # Run ESLint via expo lint
```

There are no automated tests. No build step — Expo handles bundling.

## Environment Variables

API keys live in `.env` with the `EXPO_PUBLIC_` prefix (required for Expo to expose them to the JS bundle):

```
EXPO_PUBLIC_ELEVENLABS_AGENT_ID=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_NUMBER=
```

These are read in `constants/config.ts` and imported from there — never access `process.env` directly in components.

## Architecture

**Snowball** is an Expo/React Native group-buy platform on Solana. Users join campaigns, fund them via cross-chain transfers (LI.FI), and the escrow releases to the seller once delivery is confirmed.

### Routing (expo-router file-based)

```
app/
  (tabs)/           # Bottom tab navigator: index (campaigns), wallet, ai
  campaign/[id]     # Campaign detail
  join/[id]         # Join flow (contribute to a campaign)
  funding/[id]      # Cross-chain funding via LI.FI
  delivery/[id]     # Buyer confirms delivery
  assistant.tsx     # Full-screen AI assistant (ElevenLabs voice)
  success.tsx       # Post-action success screen
```

`app/_layout.tsx` defines the root Stack and applies the dark theme (`constants/theme.ts` — `Dark` and `Brand` tokens used everywhere).

### Services

| File | Purpose |
|------|---------|
| `services/gemini.ts` | Gemini 1.5 Flash REST calls; `getCampaignAiAnalysis()` for campaign risk summaries |
| `services/lifi.ts` | LI.FI `/quote` endpoint for cross-chain route pricing |
| `services/mock-data.ts` | Static `allCampaigns` array — the app is in `DEMO_MODE = true` (no live backend) |

### AI / Voice

`components/ElevenLabsAgent.tsx` connects to the ElevenLabs Conversational AI WebSocket API. On connection it sends a `contextual_update` message with campaign data so the agent can answer questions. Audio playback is web-only (WebAudio API); native platforms receive transcripts but no audio. The agent ID is configured in the ElevenLabs dashboard — the `first_message` override is intentionally disabled because it conflicts with the agent config.

### Shared Types

All domain types (`Campaign`, `Contribution`, `SellerOffer`, `LifiRouteSummary`, etc.) are in `types/index.ts`. The campaign lifecycle follows `CampaignStatus`: DRAFT → OPEN → FUNDED → SHIPPED → DELIVERY_REVIEW → RELEASED (or DISPUTED/REFUNDED/CANCELLED).

### Theme

Import `Dark` (background, text, surface, border tokens) and `Brand` (primary, secondary, danger) from `constants/theme.ts`. Never hardcode colors.
