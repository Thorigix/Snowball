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

