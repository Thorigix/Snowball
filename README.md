# Snowball

Snowball is a mobile-first Solana group-buying escrow app.

Users can join collective purchases, fund from another chain through LI.FI, deposit into a Solana escrow program, and release seller payment only after delivery confirmation.

## Hackathon MVP

This 24-hour MVP focuses on one demo campaign:

- Product: RTX 5080 Group Buy
- Target buyers: 3
- Deposit per buyer: 0.05 devnet SOL
- Seller: NovaTech Istanbul
- Release rule: 2 of 3 delivery confirmations

## Why Snowball?

Snowball helps small groups coordinate purchases together. A group starts small, grows as more buyers join, and only releases payment when delivery conditions are satisfied.

## Person A Scope

- Solana Anchor escrow program
- Devnet deployment
- Minimal backend
- ElevenLabs TTS endpoint
- LI.FI quote/proxy endpoint
- Technical README

## Person B Scope

- Mobile app
- Campaign screens
- Wallet flow
- LI.FI funding screen
- AI assistant screen
- Demo video

## Planned Technical Stack

- Solana Devnet
- Anchor
- Rust
- TypeScript
- Express backend
- ElevenLabs Text-to-Speech
- LI.FI quote/proxy flow

## MVP Escrow Decision

For hackathon speed, the first demo escrow uses devnet SOL. The production direction is to extend the same escrow model to SPL USDC vaults.

## Current Status

A0 repository scaffold is being prepared.

## Anchor Program Status

The Snowball Anchor workspace has been initialized under `anchor/`.

Program name:

`snowball_escrow`

Current A1 status:

- Minimal Anchor workspace created
- Placeholder `initialize` instruction added
- Escrow logic not implemented yet
- Campaign and contribution accounts will be added in A2

Local commands:

```bash
cd anchor
anchor build
anchor test
```

## A2 Campaign and Join Status

A2 adds the first real on-chain Snowball escrow state.

Implemented:

- `Campaign` account
- `Contribution` account
- `CampaignStatus` enum
- `create_campaign`
- `join_campaign`

The MVP uses devnet SOL/lamports directly in the campaign account for speed.

Current lifecycle covered by tests:

```text
create_campaign → join_campaign x3 → campaign becomes Funded
```

## A3 Delivery and Release Status

A3 completes the core MVP escrow lifecycle.

Implemented:

- `mark_shipped`
- `confirm_delivery`
- `release_funds`

Current on-chain lifecycle:

```text
create_campaign → join_campaign x3 → mark_shipped → confirm_delivery x2 → release_funds
```

## A4 Backend Status

A4 adds a minimal Express backend for the Snowball demo.

Implemented endpoints:

- `GET /api/health`
- `GET /api/campaign`
- `POST /api/lifi/quote`
- `POST /api/elevenlabs/summary-audio`

A4 intentionally uses mock/fallback responses for LI.FI and ElevenLabs.

Real integrations will be added later.

Backend commands:

```bash
cd backend
npm install
npm run dev
```

## A5 ElevenLabs TTS Status

A5 connects the Snowball backend to the real ElevenLabs Text-to-Speech API.

Endpoint:

```http
POST /api/elevenlabs/summary-audio
```

Request body:

```json
{
  "campaignId": "campaign-rtx-5080-demo"
}
```

Behavior:

- The endpoint builds a fixed Snowball campaign summary text.
- If `ELEVENLABS_API_KEY` or `ELEVENLABS_VOICE_ID` is missing, the endpoint returns a JSON fallback containing the summary text and a `fallback: true` flag.
- If both env vars are set, the backend calls the ElevenLabs Text-to-Speech API at `https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128` using the model from `ELEVENLABS_MODEL_ID` (default `eleven_multilingual_v2`).
- On success, the endpoint streams back the MP3 audio with `Content-Type: audio/mpeg`, `Cache-Control: no-store`, `X-Snowball-Audio-Provider: elevenlabs`, and `X-Snowball-Fallback: false`.
- On ElevenLabs error responses or fetch failures, the endpoint returns HTTP 502 with a JSON fallback payload that includes the summary text. The server does not crash.

Required environment variables (see `.env.example`):

```text
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

The API key is never logged and never returned in responses. Do not commit any `.env` file.

## A6 LI.FI Quote Status

A6 improves the Snowball backend LI.FI endpoint.

Endpoint:

```http
POST /api/lifi/quote
```

Behavior:

- If enough quote parameters are provided, the backend proxies a live LI.FI quote request to `https://li.quest/v1/quote`.
- If quote parameters are missing or LI.FI fails, the backend returns a safe fallback route for the demo.
- `LIFI_API_KEY` is optional and only used server-side.
- No LI.FI key is exposed to the mobile app.

Required quote fields for a live LI.FI request: `fromChain`, `toChain`, `fromToken`, `toToken`, `fromAmount`, `fromAddress`. The optional `toAddress` is forwarded when present. Slippage defaults to `0.005` and the integrator defaults to `LIFI_INTEGRATOR` or `snowball`.

Environment variables (see `.env.example`):

```text
LIFI_API_KEY=
LIFI_INTEGRATOR=snowball
```

Build and test:

```bash
cd backend
npm run build
```

Then start the backend and test the fallback path:

```bash
curl -X POST http://localhost:3001/api/lifi/quote \
  -H "Content-Type: application/json" \
  -d '{"fromChain":"base","fromToken":"USDC","toChain":"solana","toToken":"SOL","amount":"10"}'
```

