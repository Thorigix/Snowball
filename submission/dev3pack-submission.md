# Dev3pack Submission

## One-Line Summary

Snowball lets student groups run bulk purchases with real Solana devnet escrow, AI risk explanations, and an honest proof page that separates live, fallback, demo-only, and roadmap features.

## Project Name

Snowball

## Tagline

Group buys protected by Solana escrow and explained by AI.

## Problem

Student clubs and small groups coordinate expensive shared purchases in chats, spreadsheets, and bank transfers. One organizer or seller often holds everyone funds, which creates trust, refund, and delivery risk.

## Solution

Snowball turns group buying into an escrow checkout. Buyers join a campaign, deposit into a Solana devnet escrow, and seller release happens only after delivery confirmation thresholds are met.

## What Judges Can Try

1. Open `http://localhost:8082`.
2. Restart the demo from the home screen.
3. Connect Phantom or Solflare on Solana Devnet.
4. Fund the wallet with local demo devnet SOL.
5. Join the RTX 5080 group buy and sign the real devnet deposit.
6. Open the success receipt and verify the transaction on Solana Explorer.
7. Open AI Risk Report and Proof tab to see state-aware risk, sponsor fit, and live/fallback/demo-only badges.
8. Use Seller Dashboard or Demo Controls to walk shipment, confirmation, release, dispute, and refund states.

## Why Solana

Solana gives Snowball fast, low-cost escrow actions that can support repeated consumer flows: campaign creation, buyer deposit, delivery confirmation, release, and future refunds.

## AI Angle

Snowball uses AI to explain escrow risk in plain language: funding status, seller withdrawal limits, missing confirmations, and dispute/refund state.

## Partner Usage

- Solana: deployed Anchor escrow program on devnet.
- LI.FI: backend quote proxy with safe fallback route preview and live quote attempt mode.
- ElevenLabs: voice/TTS path when credentials are configured; explicit text fallback otherwise.
- Solana Mobile: mobile-first UI, with desktop web used for live wallet signing during judging.

## Prize Fit

- Best Solana Consumer App: real escrow flow for a relatable student group-buy use case.
- Best AI Product Layer: AI explains escrow risk and release conditions instead of acting as a generic chatbot.
- Best Partner Integration Story: Solana, LI.FI, ElevenLabs, and mobile-first UX all appear in one coherent flow.
- Most Grant-Ready: the project states exactly what is live now and what needs funding next.

## Live vs Fallback vs Demo-Only

- Live devnet: escrow program, campaign creation, deposits, shipment, confirmations, release, Explorer links.
- Fallback: LI.FI route preview and text AI when partner credentials are unavailable.
- Demo-only: dispute and refund state, not on-chain instructions yet.
- Roadmap: SPL USDC vaults, production token accounting, on-chain dispute/refund.

## Tech Stack

Expo, React Native Web, TypeScript, Express, Anchor, Rust, Solana Web3.js, LI.FI, ElevenLabs, Gemini.

## Links

- Demo: `http://localhost:8082`
- GitHub: placeholder
- Video: placeholder

## Next Milestones

SPL USDC vaults, on-chain dispute/refund instructions, reusable escrow SDK/API, mobile wallet adapter development build, and student club pilots.

## Short Pitch

Group buying is already social, but the payment layer is still trust-based. Snowball makes it programmable: buyers deposit into Solana escrow, seller release waits for delivery confirmations, and AI explains exactly what is safe or risky at each state. The hackathon demo is honest about scope: the escrow path is live on devnet, partner integrations have clear fallback modes, and dispute/refund plus USDC vaults are the next grant milestones.
