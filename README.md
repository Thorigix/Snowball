# Snowball

Snowball is a Solana escrow checkout for student group buys. Buyers join a campaign, deposit into a real Solana devnet escrow program, and the seller can only receive funds after the delivery confirmation rule is satisfied.

The demo combines a deployed Anchor program, a mobile-first Expo interface, live LI.FI quote/transaction generation for cross-chain funding, and an AI layer that explains escrow risk in plain language.

## Why It Exists

Student clubs and small communities often coordinate group purchases through chats, spreadsheets, and manual bank transfers. One organizer or seller ends up holding everyone funds, which creates trust, refund, delivery, and dispute risk.

Snowball turns that informal process into a programmable checkout:

- Buyers see the campaign terms before depositing.
- Funds are locked by an escrow program instead of a person.
- Seller release is blocked until enough buyers confirm delivery.
- AI explains the current risk state for non-crypto users.
- LI.FI shows how buyers can enter the Solana flow from another chain.

## Current Demo Scope

| Area | Status | Notes |
| --- | --- | --- |
| Solana escrow | Live devnet | Deployed Anchor program with campaign creation, buyer deposits, shipment, confirmations, and seller release. |
| Wallet signing | Live devnet | Desktop web demo signs with Phantom or Solflare on Solana Devnet. |
| LI.FI funding | Live mainnet quote/tx generation | Backend calls LI.FI `/v1/quote`, returns executable EVM `transactionRequest`, and the UI handles ERC20 approval before bridge send. |
| AI text assistant | Live with Gemini key | Falls back to clear local copy if no key is configured. |
| ElevenLabs voice | Live with agent credentials | Web voice assistant is gated by browser audio and ElevenLabs config. |
| Dispute/refund | Demo-only | Local app/backend state only; no on-chain dispute or refund instruction yet. |
| Production USDC vaults | Roadmap | Current escrow uses devnet SOL for hackathon speed. SPL USDC vaults are the next milestone. |

Important LI.FI distinction: LI.FI no longer supports normal bridge testing on testnets. The LI.FI screen uses mainnet routes, while the Snowball escrow program is on Solana devnet. In the demo, LI.FI proves the live cross-chain funding rail and the escrow deposit proves the Solana program lifecycle. Production would connect these on mainnet with token vaults.

## Architecture

```text
Expo / React Native Web
  app/(tabs)          Campaigns, wallet, seller, AI, proof
  app/funding/[id]   LI.FI quote, approval, bridge transaction flow
  app/join/[id]      Solana devnet escrow deposit

Express Backend
  /api/campaign      Devnet campaign snapshot and mutations
  /api/lifi/quote    Live LI.FI quote proxy
  /api/demo/preflight Demo readiness and partner status
  /api/elevenlabs    Optional voice/TTS integration

Anchor Program
  create_campaign
  join_campaign
  mark_shipped
  confirm_delivery
  release_funds
```

## Tech Stack

- Expo, React Native Web, TypeScript
- Express backend
- Anchor, Rust, Solana Web3.js
- LI.FI REST API
- Gemini text AI
- ElevenLabs conversational AI

## Quick Start

Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix anchor install
```

Start the backend:

```bash
npm run backend:dev
```

Start the web app:

```bash
npm run web:demo
```

Open:

```text
http://localhost:8082
```

For the Solana escrow demo, use Phantom or Solflare on **Solana Devnet**.

## Demo URLs

- Web app: `http://localhost:8082`
- Backend health: `http://localhost:3001/api/health`
- Demo preflight: `http://localhost:3001/api/demo/preflight`
- Devnet program: `https://explorer.solana.com/address/2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss?cluster=devnet`

## Recommended Judge Flow

1. Open `http://localhost:8082`.
2. Open the Proof tab and verify demo preflight.
3. Return Home and press Restart Demo.
4. Open Wallet, connect Phantom or Solflare on Solana Devnet, then fund the wallet with local demo devnet SOL.
5. Open the RTX 5080 campaign and inspect the escrow status.
6. Optional: open Cross-chain Funding and request a live LI.FI quote from Base USDC to Solana SOL.
7. Continue to Join Campaign and sign the real devnet deposit.
8. Open the success receipt and verify the transaction on Solana Explorer.
9. Open AI and ask why the seller cannot withdraw yet.
10. Open Seller Dashboard or Demo Controls and walk shipment, delivery confirmations, and release.
11. Return to Proof and review the transaction trail and scope labels.

## LI.FI Integration

Snowball uses LI.FI as a real cross-chain funding rail, not as a static logo.

Backend endpoint:

```text
POST /api/lifi/quote
```

Example request:

```json
{
  "fromChain": "Base",
  "toChain": "solana",
  "fromToken": "USDC",
  "toToken": "SOL",
  "fromAmount": "1000000",
  "fromAddress": "0x...",
  "toAddress": "SolanaMainnetAddress"
}
```

What the integration does:

- Normalizes supported chain names to LI.FI chain IDs.
- Maps common tokens to their live token addresses.
- Calls LI.FI `/v1/quote`.
- Returns route id, tool, estimate, gas, receive amount, approval target, and `transactionRequest`.
- On the frontend, checks ERC20 allowance with `eth_call`.
- Sends exact ERC20 approval when needed.
- Requests a fresh quote after approval.
- Sends the returned EVM bridge transaction through the injected wallet.

What it does not claim:

- It does not bridge to Solana devnet.
- It does not deposit bridged funds into the current devnet escrow.
- It does not make Snowball mainnet-ready by itself.

## Solana Escrow Program

Program ID:

```text
2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss
```

Network:

```text
Solana Devnet
```

Demo lifecycle:

```text
create_campaign -> join_campaign x3 -> mark_shipped -> confirm_delivery x2 -> release_funds
```

Run the full Anchor devnet proof:

```bash
cd anchor
npm run demo:devnet
```

The script requires `ANCHOR_WALLET=~/.config/solana/id.json` with enough devnet SOL. A sample lifecycle proof is captured in `handoff/a6-devnet-demo-flow.md`.

## Backend API

```text
GET  /api/health
GET  /api/demo/preflight
GET  /api/campaign
POST /api/campaign/join
POST /api/campaign/mark-shipped
POST /api/campaign/confirm-delivery
POST /api/campaign/release
POST /api/campaign/reset
POST /api/campaign/fund-wallet
POST /api/lifi/quote
POST /api/elevenlabs/summary-audio
```

`POST /api/campaign/fund-wallet` transfers devnet SOL from the local provider wallet to the connected wallet. It is for local demos only and should not be deployed publicly without authentication, rate limits, and treasury controls.

## Environment

Create local `.env` files as needed. Do not commit secrets.

```text
# Backend
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=/Users/you/.config/solana/id.json
ANCHOR_WALLET_JSON=
LIFI_API_KEY=
LIFI_INTEGRATOR=snowball
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# Expo public env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
EXPO_PUBLIC_ELEVENLABS_AGENT_ID=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_NUMBER=
```

LI.FI quotes can work without `LIFI_API_KEY`, but a key is recommended for production rate limits and partner analytics.

## Commands

```bash
npm run web:demo        # Expo web on port 8082
npm run backend:dev     # Express backend on port 3001
npm run lint            # Expo lint
npm run check           # Frontend lint + backend TypeScript build
npm --prefix backend run build
cd anchor && npm run demo:devnet
```

## Repository Map

```text
app/                    Expo Router screens
components/             Shared UI and AI/voice components
services/               Frontend service clients and wallet helpers
backend/src/            Express API, devnet escrow bridge, LI.FI proxy
anchor/programs/        Anchor escrow program
anchor/scripts/         Devnet lifecycle proof
submission/             Dev3pack judging material
handoff/                Deployment and verification notes
```

## Prize Fit

- Best Solana Consumer App: a relatable group-buying use case backed by real escrow state and Explorer-verifiable devnet signatures.
- Best AI Product Layer: AI explains seller release risk, funding state, and dispute context where users need clarity.
- Best Partner Integration Story: Solana escrow, LI.FI cross-chain entry, ElevenLabs voice, and mobile-first UX each have a concrete surface in the app.
- Grant Ready: the current scope, missing production pieces, and next milestones are explicit.

## Roadmap

- Move escrow settlement from devnet SOL to mainnet SPL USDC vaults.
- Add on-chain dispute and refund instructions.
- Connect LI.FI funding output directly into production escrow vault deposits.
- Add reusable escrow SDK/API for other group-buying apps.
- Build a production mobile wallet adapter flow.
- Pilot with student clubs for hardware, book, and trip group buys.

## Limitations

- Snowball is not mainnet-ready.
- Current escrow is Solana devnet SOL.
- LI.FI produces mainnet bridge transactions; it does not support this demo escrow on devnet.
- Dispute and refund are not on-chain yet.
- Full mobile wallet signing requires a development build; the judged live signing demo is desktop web with Phantom or Solflare.

## Submission Materials

- `demo-script.md` - presenter flow and 90-second video script.
- `submission/dev3pack-submission.md` - submission copy.
- `submission/judge-quickstart.md` - 5-minute judge setup.
- `submission/demo-video-shotlist.md` - recording sequence.
- `submission/screenshots.md` - screenshot checklist and captions.
- `submission/submission-pack.html` - single-page judging packet.
- `handoff/a6-devnet-demo-flow.md` - sample full devnet lifecycle run.
