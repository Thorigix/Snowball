# Snowball Demo Script

## Demo Campaign

Product: RTX 5080 Group Buy  
Target buyers: 3  
Deposit per buyer: 0.05 devnet SOL  
Seller: NovaTech Istanbul  
Release rule: 2 of 3 delivery confirmations release funds to seller

## Demo Platform

The live demo runs in a **desktop browser** (Chrome / Edge / Brave) via `npm run web`.

Reasons:
- Phantom / Solflare browser extensions sign the on-chain `join_campaign` instruction.
- ElevenLabs Conversational AI (Sarah) uses WebRTC and only works in a browser.
- Mobile Wallet Adapter and `@elevenlabs/react-native` would require an EAS dev build, which is out of scope for this hackathon MVP.

Expo Go on a physical device still loads the UI, but voice and `Sign Deposit` will be disabled — use it for screen-only walkthroughs only.

## Pre-Demo Checklist

Before opening the app:

1. Backend is up: `cd backend && npm run dev` (port 3001).
2. Backend provider wallet has at least 0.5 devnet SOL: `solana balance --url devnet`. Each demo run consumes roughly 0.16 SOL (campaign init + 2 buyer seeds + fund-wallet). If low, top up via [faucet.solana.com](https://faucet.solana.com) or [faucet.quicknode.com/solana/devnet](https://faucet.quicknode.com/solana/devnet) — `solana airdrop` is heavily rate-limited.
3. Browser has Phantom or Solflare installed and switched to **Solana Devnet**.
4. Open Chrome to `http://localhost:8081` (Expo web URL).

## Demo Flow (Live)

1. **Restart Demo** — top-right pill on the home screen. Confirms the on-chain campaign is back to OPEN with 2 / 3 buyers seeded. Wait for the spinner (~5 s).
2. **Wallet tab → Connect Wallet** — Phantom popup, approve. Address + 0.00 SOL balance appears.
3. **Get Devnet SOL** — first action in the action row. Backend airdrops 0.06 devnet SOL to the connected wallet, balance refreshes automatically.
4. **Home → RTX 5080 card** — open the campaign detail. Show progress bar at 2/3, escrow PDA, status `OPEN`.
5. (Optional) **Fund from Another Chain** — show LI.FI quote screen, get a route from Base USDC → Solana SOL, then "Continue to Deposit".
6. **Sign Deposit** — Phantom popup, approve. Real devnet TX signature appears on Success screen, "View on Solana Explorer" link is clickable.
7. **AI tab** — tap the mic, talk to Sarah ("How does the escrow protect me?"). Voice in/out, campaign context already loaded.
8. **Demo Controls FAB → Mark Shipped → Confirm Delivery → Confirm Delivery → Release Funds** — each step is a real devnet TX from the backend provider keypair. Status badges update live: `FUNDED → SHIPPED → DELIVERY_REVIEW → RELEASED`.
9. **Reset for next run** — Restart Demo on the home screen.

## 90-Second Demo Video Script

Target length: 90-120 seconds. Keep the first 20 seconds focused on problem plus live proof.

### 0-20s — Problem + Live Proof

"Snowball lets student clubs and small groups run group buys without trusting one organizer or seller with everyone money. This live campaign is an RTX 5080 group buy: 2 of 3 buyers already funded, 0.10 devnet SOL is locked, and seller release is controlled by a Solana escrow rule."

Show:
- Home screenshot hero: "Group buys protected by Solana escrow."
- RTX campaign card with live buyers and locked amount.
- Open Guided Demo Mode checklist.

### 20-45s — Buyer Deposit + Receipt

"A buyer joins, signs a deposit, and receives a receipt that explains what happened: amount, escrow PDA, buyer wallet, status, and Explorer proof."

Show:
- Wallet connected.
- Join / Sign Deposit.
- Success receipt proof card.

### 45-65s — AI Trust Layer

"The AI layer is not a chatbot wrapper. It reads campaign state and explains trust and risk in non-crypto language: seller cannot withdraw, one more deposit is needed, or confirmations are still missing."

Show:
- Campaign detail AI Risk Report.
- State-aware sentence and risk rows.

### 65-85s — Seller + Dispute Path

"On the seller side, Snowball looks like a real marketplace operation dashboard: shipment status, escrow total, confirmations, release readiness, verified seller profile, and dispute/refund handling."

Show:
- Seller Dashboard.
- Raise Dispute.
- Seller release blocked.
- Refund Buyer action.

### 85-105s — Grant Close

"The hackathon proof uses devnet SOL for speed. The production milestone is an SPL USDC vault interface, reusable escrow SDK/API, and student club pilots for hardware, books, and trip buys."

Show:
- Proof tab.
- USDC vault interface stub.
- Why Snowball Deserves Grant section.

## Notes

This demo uses devnet SOL for speed. The production version can extend the escrow to SPL USDC vaults.

## Devnet Deployment

Network: Solana Devnet  
Program ID: 2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss  
Explorer: https://explorer.solana.com/address/2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss?cluster=devnet

## Devnet Demo Flow

The devnet demo flow proves the full Snowball escrow lifecycle:

```text
create_campaign → join_campaign x3 → mark_shipped → confirm_delivery x2 → release_funds
```

Run from `anchor/`:

```
npm run demo:devnet
```

Or directly:

```
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-mocha -p ./tsconfig.json -t 1000000 scripts/devnet-demo-flow.ts
```

The script generates fresh ephemeral keypairs (creator, seller, buyer1–buyer3), funds them from the provider wallet via `SystemProgram.transfer` (no airdrop), runs the full lifecycle against the deployed devnet program, and prints every public key, PDA, and transaction signature with explorer links.

Provider wallet must hold at least 0.7 devnet SOL. Private keys are never printed or saved.

A full sample run (public keys, PDAs, signatures, balance check) is captured in `handoff/a6-devnet-demo-flow.md`.

## A-Person Final Demo Proof

A-person side provides:

- Devnet Program ID
- Program Explorer link
- Full devnet escrow lifecycle proof
- Backend endpoints
- LI.FI quote endpoint
- ElevenLabs summary endpoint
- Mobile integration handoff

Reference files:

- `handoff/a5-devnet-deployment.md`
- `handoff/a6-devnet-demo-flow.md`
- `handoff/a10-mobile-integration-handoff.md`
- `handoff/a-person-final-status.md`
