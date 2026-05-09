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

## Why Snowball Deserves Grant

Snowball's hackathon thesis is narrow and demoable: consumer group-buying UX built on a reusable Solana escrow primitive, with AI explaining trust and risk to non-crypto users.

The proof is not just a pitch. The app shows campaign discovery, buyer deposit, shipment state, delivery confirmation, seller release readiness, a seller dashboard, LI.FI funding, and a grant/proof page backed by devnet-oriented transaction metadata.

Grant fit:

- Solana gets a repeatable consumer escrow use case with campaign creation, deposits, confirmations, releases, and future refunds.
- LI.FI fits the buyer acquisition path by letting users fund Solana escrow from other chains.
- AI/voice explains state-dependent risk in plain language, making escrow understandable to non-crypto buyers.
- The next milestone is a reusable escrow API/SDK, SPL USDC vaults, dispute/refund handling, and seller pilots.

## P1 Trust and Proof Layer

Snowball now shows the escrow product surface beyond the happy path:

- Buyer dispute flow: buyers can raise a dispute during delivery review; seller release is blocked in demo state.
- Refund path: the seller dashboard and demo controls expose a refund action for disputed campaigns.
- USDC vault roadmap: campaign and proof screens clearly explain that devnet SOL is for demo speed and production settlement moves to SPL USDC vaults.
- Transaction receipt: success screen shows amount, escrow PDA, buyer wallet, status, and explorer links when devnet addresses are available.
- Seller reputation: NovaTech Istanbul and other sellers have verification, fulfilled-order count, dispute rate, and delivery SLA badges.

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


## A7 Devnet Deployment Status

The Snowball Anchor program has been deployed to Solana Devnet.

Network:

```text
Solana Devnet
RPC: https://api.devnet.solana.com
```

Program ID:

```text
2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss
```

Upgrade authority:

```text
9ybegvEC4kzW7V9nPgY9qDBMgNsPEGgZYZE6GxhZstwD
```

ProgramData address:

```text
8bxb2cDPzNs1bk4Ym2wcTJiYPHfXW46hh9znmFCdVhaD
```

Solana Explorer:

```text
https://explorer.solana.com/address/2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss?cluster=devnet
```

Verification:

```bash
solana program show 2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss --url devnet
```

Mobile handoff file:

```text
handoff/a5-devnet-deployment.md
```

Notes:

- `Anchor.toml` declares the program under both `[programs.localnet]` and `[programs.devnet]` so local tests stay usable while the devnet deployment is addressable.
- `declare_id!` in `programs/snowball_escrow/src/lib.rs` matches `anchor keys list`; no `anchor keys sync` was required.
- All 11 Anchor tests pass against localnet prior to deploy.
- No new Anchor instructions, escrow logic changes, refund flow, or demo seed flow were added in A7.
- No native, local, on-device, embedded, or self-hosted ML model dependency was introduced. AI features remain external-API only.

## A8 Devnet Demo Flow Status

A8 creates a real devnet demo flow for the Snowball escrow lifecycle against the deployed program.

Flow:

```text
create_campaign → join_campaign x3 → mark_shipped → confirm_delivery x2 → release_funds
```

Program ID:

```text
2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss
```

Explorer:

```text
https://explorer.solana.com/address/2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss?cluster=devnet
```

Demo campaign:

- Target buyers: 3
- Deposit per buyer: 0.05 devnet SOL
- Release rule: 2 of 3 delivery confirmations release funds to seller

Script location:

```text
anchor/scripts/devnet-demo-flow.ts
```

Run from `anchor/`:

```bash
npm run demo:devnet
```

Or directly:

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-mocha -p ./tsconfig.json -t 1000000 scripts/devnet-demo-flow.ts
```

Behavior:

- Generates fresh ephemeral keypairs for creator, seller, buyer1, buyer2, buyer3.
- Funds them from the provider wallet via `SystemProgram.transfer` (no airdrop).
- Derives `Campaign` and `Contribution` PDAs using the program's seeds: `[b"campaign", creator]` and `[b"contribution", campaign, buyer]`.
- Calls `create_campaign`, three `join_campaign`, `mark_shipped`, two `confirm_delivery`, then `release_funds` against the deployed devnet program.
- Asserts state transitions: `Open → Funded → Shipped → Released`, `current_buyers = 3`, `total_deposited = 150_000_000`, `confirmations = 2`.
- Records seller balance before and after release and prints a clean summary with every public key, PDA, transaction signature, and Solana Explorer link.

Provider wallet must hold at least 0.7 devnet SOL to seed the ephemeral wallets. If the provider balance is below this threshold the script stops with a clear error.

Private keys are never printed and never written to disk. Ephemeral keypairs are discarded after the run.

Mobile handoff file:

```text
handoff/a6-devnet-demo-flow.md
```

Notes:

- No new Anchor instructions, escrow logic changes, or backend changes were made in this A8 step.
- No new dependencies were added; the script reuses the existing `ts-mocha`, `chai`, and `@anchor-lang/core` workspace deps.
- No native, local, on-device, embedded, or self-hosted ML model dependency was introduced. The flow exercises only the on-chain Snowball program.

## Solana Program

Network: Solana Devnet

Program ID:

```text
2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss
```

Explorer:

```text
https://explorer.solana.com/address/2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss?cluster=devnet
```

Instructions:

- `initialize`
- `create_campaign`
- `join_campaign`
- `mark_shipped`
- `confirm_delivery`
- `release_funds`

## Backend

Path: `backend/`

```bash
cd backend
npm install
npm run build
npm run dev
```

Endpoints:

- `GET /api/health`
- `GET /api/campaign`
- `POST /api/lifi/quote`
- `POST /api/elevenlabs/summary-audio`

## Environment Variables

Public/demo env names only (do not commit real API keys):

```text
PORT=3001
PROGRAM_ID=2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss
SOLANA_NETWORK=devnet
BACKEND_URL=http://localhost:3001

ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
LIFI_API_KEY=
LIFI_INTEGRATOR=snowball
```

Do not commit real API keys.

## Handoff Files

- `handoff/a5-devnet-deployment.md`
- `handoff/a6-devnet-demo-flow.md`
- `handoff/a10-mobile-integration-handoff.md`
- `handoff/a-person-final-status.md`

## Final Verification

Anchor:

```bash
cd anchor
anchor build
anchor test
npm run demo:devnet
```

Backend:

```bash
cd backend
npm run build
npm run dev
```

Endpoint test examples:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/campaign
curl -X POST http://localhost:3001/api/lifi/quote \
  -H "Content-Type: application/json" \
  -d '{"fromChain":"base","fromToken":"USDC","toChain":"solana","toToken":"SOL","amount":"10"}'
curl -X POST http://localhost:3001/api/elevenlabs/summary-audio \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-rtx-5080-demo"}'
```

## Environment Examples

The repository includes example environment files:

```text
.env.example
backend/.env.example
handoff/mobile.env.example
```

Rules:

- Copy `backend/.env.example` to `backend/.env` for local backend runtime.
- Copy `handoff/mobile.env.example` values into the mobile app environment.
- Do not commit real `.env` files.
- Do not expose `ELEVENLABS_API_KEY` or `LIFI_API_KEY` to the mobile app.
- For physical phone testing, replace localhost backend URL with an ngrok or LAN URL.
