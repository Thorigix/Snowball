/**
 * Snowball — App Configuration
 */

export const DEMO_MODE = true;

/** Backend */
export const BACKEND_URL = __DEV__
  ? "http://localhost:3001"
  : "https://snowball-api.example.com";

/** Solana */
export const SOLANA_NETWORK = "devnet";
export const SOLANA_RPC_URL = "https://api.devnet.solana.com";
export const PROGRAM_ID = "PROGRAM_ID_PLACEHOLDER";

/** Explorer */
export const EXPLORER_BASE_URL = "https://explorer.solana.com";
export const getExplorerTxUrl = (txHash: string) =>
  `${EXPLORER_BASE_URL}/tx/${txHash}?cluster=${SOLANA_NETWORK}`;
export const getExplorerAddressUrl = (address: string) =>
  `${EXPLORER_BASE_URL}/address/${address}?cluster=${SOLANA_NETWORK}`;

/** ElevenLabs Conversational AI */
export const ELEVENLABS_AGENT_ID = "REDACTED";

/** Gemini */
export const GEMINI_API_KEY = "REDACTED";
export const FIREBASE_PROJECT_NUMBER = "REDACTED";
