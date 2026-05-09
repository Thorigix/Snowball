# Snowball Demo Script

## Demo Campaign

Product: RTX 5080 Group Buy  
Target buyers: 3  
Deposit per buyer: 0.05 devnet SOL  
Seller: NovaTech Istanbul  
Release rule: 2 of 3 delivery confirmations release funds to seller

## Demo Flow

1. User opens the mobile app and sees the RTX 5080 group-buy campaign.
2. User sees the LI.FI cross-chain funding option.
3. User deposits into the Solana escrow.
4. ElevenLabs assistant explains the campaign and escrow protection.
5. Buyer confirms delivery.
6. Funds are released to the seller.

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
