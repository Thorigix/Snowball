# Snowball A10 Mobile Integration Handoff

## Public Config

BACKEND_URL=http://localhost:3001
NETWORK=devnet
PROGRAM_ID=2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss
CAMPAIGN_ID=campaign-rtx-5080-demo

## Program

Network: Solana Devnet
Program ID: 2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss
Explorer: https://explorer.solana.com/address/2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss?cluster=devnet

## Backend Endpoints

Base URL for local development:

http://localhost:3001

Endpoints:

GET /api/health
GET /api/campaign
POST /api/lifi/quote
POST /api/elevenlabs/summary-audio

## Endpoint Usage

### Health

GET /api/health

Expected response includes:

- ok: true
- service: snowball-backend
- project: Snowball

### Campaign

GET /api/campaign

Mobile should use this endpoint to load:

- campaign id
- title
- seller name
- target buyers
- deposit amount
- release rule
- network
- program id
- LI.FI enabled flag
- ElevenLabs enabled flag

### LI.FI Quote

POST /api/lifi/quote

Demo fallback request:

```json
{
  "fromChain": "base",
  "fromToken": "USDC",
  "toChain": "solana",
  "toToken": "SOL",
  "amount": "10"
}
```

The backend returns a fallback route if live LI.FI quote parameters are missing.

### ElevenLabs Summary Audio

POST /api/elevenlabs/summary-audio

Request:

```json
{
  "campaignId": "campaign-rtx-5080-demo"
}
```

Behavior:

- If backend has ElevenLabs env vars, it returns audio/mpeg.
- If env vars are missing, it returns JSON fallback text.
- Mobile should handle both cases.

## Devnet Demo Proof

Reference:

handoff/a6-devnet-demo-flow.md

This file contains:

- campaign PDA
- contribution PDAs
- public wallets
- transaction signatures
- explorer links
- seller balance before and after release

The demo flow proves:

create_campaign → join_campaign x3 → mark_shipped → confirm_delivery x2 → release_funds

## Mobile Notes

For now, B person only needs to connect to backend endpoints.

The mobile app should not receive:

- Solana private key
- seed phrase
- ElevenLabs API key
- LI.FI API key
- any .env file

For physical phone testing, BACKEND_URL may need to be replaced later with an ngrok or LAN URL. Do not change this in the repository yet.
