# Dev3pack Submission

## Project Name

Snowball

## Tagline

Group buys protected by Solana escrow and explained by AI.

## Problem

Student clubs and small groups coordinate expensive shared purchases in chats, spreadsheets, and bank transfers. One organizer or seller often holds everyone funds, which creates trust, refund, and delivery risk.

## Solution

Snowball turns group buying into an escrow checkout. Buyers join a campaign, deposit into a Solana devnet escrow, and seller release happens only after delivery confirmation thresholds are met.

## Why Solana

Solana gives Snowball fast, low-cost escrow actions that can support repeated consumer flows: campaign creation, buyer deposit, delivery confirmation, release, and future refunds.

## AI Angle

Snowball uses AI to explain escrow risk in plain language: funding status, seller withdrawal limits, missing confirmations, and dispute/refund state.

## Partner Usage

- Solana: deployed Anchor escrow program on devnet.
- LI.FI: backend quote proxy with safe fallback route preview.
- ElevenLabs: voice/TTS path when credentials are configured; text fallback otherwise.
- Solana Mobile: mobile-first UI, with desktop web used for live wallet signing during judging.

## Tech Stack

Expo, React Native Web, TypeScript, Express, Anchor, Rust, Solana Web3.js, LI.FI, ElevenLabs, Gemini.

## Links

- Demo: `http://localhost:8082`
- GitHub: placeholder
- Video: placeholder

## Next Milestones

SPL USDC vaults, on-chain dispute/refund instructions, reusable escrow SDK/API, mobile wallet adapter development build, and student club pilots.
