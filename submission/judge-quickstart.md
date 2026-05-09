# Judge Quickstart

This path is optimized for a 5-minute local review. The demo is built for desktop web because Phantom and Solflare browser extensions can sign the Solana devnet deposit.

## Requirements

- Node/npm
- Phantom or Solflare browser wallet
- Wallet network set to Solana Devnet
- Backend provider wallet at `~/.config/solana/id.json` with devnet SOL

1. Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix anchor install
```

2. Start the backend:

```bash
npm run backend:dev
```

3. Start Expo web:

```bash
npm run web:demo
```

4. Open `http://localhost:8082`.

5. Verify preflight:

```bash
curl http://localhost:3001/api/demo/preflight
```

Green path:

- `backendOk: true`
- `campaignReachable: true` after opening/restarting the demo
- `providerBalanceSol` above `0.5`

Warnings for LI.FI or ElevenLabs missing env vars are acceptable; the UI labels those paths as fallback.

6. Use Phantom or Solflare on Solana Devnet.

7. Demo path:

- Home -> Restart Demo
- Wallet -> Connect Wallet
- Wallet -> Get Devnet SOL
- RTX 5080 campaign -> Join Campaign -> Sign Deposit
- Success receipt -> open real Explorer transaction
- AI tab -> inspect risk explanation
- Seller Dashboard / Demo Controls -> shipment, confirmations, release
- Proof tab -> verify live/fallback/demo-only badges

## What To Look For

- Real Solana signatures link to Explorer.
- Local dispute/refund events are labeled as demo-only and do not link to fake Explorer pages.
- The Proof tab shows Dev3pack prize fit, partner status, and next milestones.
- README and submission docs avoid mainnet-ready claims.
