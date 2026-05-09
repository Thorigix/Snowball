# Snowball Dev3pack Grant Strategy

## Positioning

Snowball is a mobile-first Solana escrow checkout for group purchases.

The strongest grant story is not "group buying app". It is:

> Snowball turns informal group-buy coordination into a trust-minimized checkout primitive: buyers deposit into Solana escrow, delivery confirmations unlock seller payment, and AI explains risk/status to non-crypto users.

## Why This Fits Dev3pack

Dev3pack is a Web3 + AI student hackathon with Solana, ElevenLabs, LI.FI, Superteam, Ledger, Virtuals, and Solana Mobile partner alignment.

Snowball already touches the strongest partner surfaces:

- Solana: deployed devnet Anchor escrow, real transaction flow, Explorer links.
- LI.FI: cross-chain funding route via backend proxy and fallback path.
- ElevenLabs: campaign assistant and voice-first escrow explanation.
- Solana Mobile: mobile-first escrow UX, with desktop browser used for current live wallet signing.

## What Was Added For Judges

- In-app Proof tab.
- Live devnet campaign metrics.
- Program and escrow PDA Explorer links.
- Transaction trail with Explorer links.
- Partner-fit cards.
- Grant-ready impact narrative.

## Feature Priority List

### Added Now

1. **Judge Proof Center**
   - Shows current devnet status, locked SOL, buyer count, confirmations, program ID, escrow PDA, and transaction history.
   - Purpose: lets a judge verify the project in under 60 seconds.

2. **Grant Narrative In Product**
   - Explains why Snowball deserves funding directly in the app.
   - Purpose: improves demo clarity and makes the product feel like a fundable startup, not only a demo.

3. **Partner Fit Surface**
   - Explicit Solana, LI.FI, ElevenLabs, and Solana Mobile cards.
   - Purpose: helps sponsor/judge alignment without adding risky new integrations.

### Best Next Features

1. **Seller Dashboard**
   - Screen for seller shipment status, release readiness, and buyer confirmations.
   - Impact: makes the marketplace two-sided and more fundable.
   - Effort: medium.

2. **Dispute / Refund Path**
   - UI plus backend demo action for buyer dispute and refund state.
   - Impact: escrow feels complete and safer.
   - Effort: medium to high if on-chain; low if demo-only.

3. **AI Risk Report**
   - AI generates a campaign risk summary: seller trust, price anomaly, escrow status, missing confirmations.
   - Impact: turns AI from chat into decision support.
   - Effort: low to medium.

4. **Submission Mode**
   - A read-only guided demo route for judges with each step and expected outcome.
   - Impact: reduces demo failure risk.
   - Effort: low.

5. **SPL USDC Roadmap Stub**
   - Not a fake implementation. Add docs and UI copy that the current devnet SOL escrow maps to SPL USDC vaults next.
   - Impact: answers "why not real stablecoins yet?"
   - Effort: low.

## Demo Narrative

1. Problem: group buys currently happen in chats, spreadsheets, and manual transfers.
2. Solution: Snowball gives the group a shared Solana escrow checkout.
3. Proof: show Proof tab first, then campaign join, then transaction Explorer link.
4. AI: Sarah explains escrow risk and status in plain language.
5. Partner fit: LI.FI funds from another chain; Solana escrow controls release; ElevenLabs helps non-crypto buyers understand the flow.
6. Grant ask: fund the move from devnet SOL demo to SPL USDC vaults, seller dashboard, and dispute/refund flow.

## Submission Claims To Avoid

- Do not claim mainnet readiness.
- Do not claim LI.FI live bridging unless a full quote with required wallet parameters succeeds.
- Do not claim ElevenLabs live voice unless `EXPO_PUBLIC_ELEVENLABS_AGENT_ID` and backend voice credentials are working during the recording.
- Do not claim mobile wallet signing in Expo Go; current live signing is desktop browser with Phantom/Solflare.

