# Snowball

Snowball is a Solana group-buying escrow demo for Dev3pack. Buyers join a campaign, fund a real devnet escrow deposit from a browser wallet, and see seller release logic explained through proof screens and AI-assisted risk copy.

## Quick Start

```bash
npm install
npm --prefix backend install
npm --prefix anchor install
npm run backend:dev
npm run web:demo
```

Open `http://localhost:8082`, switch Phantom or Solflare to Solana Devnet, then use Wallet -> Connect Wallet -> Get Devnet SOL before joining the RTX 5080 campaign.

## Demo URLs

- Web app: `http://localhost:8082`
- Backend health: `http://localhost:3001/api/health`
- Demo preflight: `http://localhost:3001/api/demo/preflight`
- Devnet program: `https://explorer.solana.com/address/2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss?cluster=devnet`

## What Is Live vs Demo-Only

- Live devnet: deployed Anchor escrow program, campaign creation, buyer deposits, shipment marking, delivery confirmations, seller release, wallet funding for local demo.
- Live when credentials are present: LI.FI quote proxy, ElevenLabs TTS/agent, Gemini text responses.
- Fallback: LI.FI route preview and AI text copy continue to work without partner credentials.
- Demo-only state: dispute and refund events are local app/backend demo state and are not on-chain instructions.
- Roadmap stub: SPL USDC vaults are shown as the next production milestone.

## Devnet Program

- Program ID: `2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss`
- Network: Solana Devnet
- Demo lifecycle: `create_campaign -> join_campaign x3 -> mark_shipped -> confirm_delivery x2 -> release_funds`
- Anchor proof command:

```bash
cd anchor
npm run demo:devnet
```

`npm test` in `anchor/` aliases the devnet demo flow and requires `ANCHOR_WALLET=~/.config/solana/id.json` with enough devnet SOL.

## Submission Proof

- `demo-script.md` contains the live presenter flow and 90-120 second video script.
- `submission/dev3pack-submission.md` contains the project submission copy.
- `submission/judge-quickstart.md` contains a 5-minute judge setup path.
- `submission/demo-video-shotlist.md` contains the recording sequence.
- `submission/dev3pack-feature-opportunities.md` lists the next features that can pull Dev3pack judges in.
- `submission/screenshots.md` lists the screenshots and captions needed for a polished submission.
- `submission/submission-pack.html` is a single-page copy/paste judging packet.
- `handoff/a6-devnet-demo-flow.md` captures a sample full devnet lifecycle run.

## Dev3pack Prize Fit

- Solana Consumer App: a familiar group-buying use case backed by real devnet escrow.
- AI Product Layer: AI explains escrow safety, seller release risk, and dispute state in plain language.
- Partner Integration Story: Solana, LI.FI, ElevenLabs, and mobile-first UX are each visible without hiding fallback modes.
- Grant Ready: current live scope and next milestones are explicit, so judges can trust the roadmap.

## Recommended Demo Order

1. Proof tab -> Demo Preflight.
2. Home -> Restart Demo.
3. Wallet -> Connect Wallet -> Get Devnet SOL.
4. RTX 5080 campaign -> Join Campaign -> Sign Deposit.
5. Success receipt -> open Explorer.
6. AI tab -> ask why the seller cannot withdraw yet.
7. LI.FI screen -> show quote preview vs live quote attempt.
8. Seller Dashboard or Demo Controls -> shipment, confirmations, release.
9. Dispute/refund path -> explain demo-only status.
10. Proof tab -> Dev3pack Prize Fit, Partner Fit, and Transaction Trail.

## Commands

```bash
npm run web:demo      # Expo web on port 8082
npm run backend:dev   # Express backend on port 3001
npm run lint          # Expo lint
npm run check         # frontend lint + backend TypeScript build
cd backend && npm run build
cd anchor && npm run lint
```

## Environment

Copy environment values into local `.env` files only. They are ignored by git.

```text
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
LIFI_API_KEY=
LIFI_INTEGRATOR=snowball
EXPO_PUBLIC_ELEVENLABS_AGENT_ID=
EXPO_PUBLIC_GEMINI_API_KEY=
```

The backend `POST /api/campaign/fund-wallet` endpoint transfers devnet SOL from the local provider wallet. It is for local demos only and should not be deployed publicly without authentication and rate limits.

## Claims We Do Not Make

- Snowball is not mainnet-ready.
- Dispute and refund are not on-chain yet.
- The USDC vault is the next milestone, not current production settlement.
- Full mobile wallet signing requires a development build; the judged live signing demo is desktop web with Phantom or Solflare.
