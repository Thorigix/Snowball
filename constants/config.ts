/**
 * Snowball — App Configuration
 * Demo mode toggle ve genel config.
 */

/** Demo mode açıkken mock data kullanılır, kapalıyken gerçek backend/SDK */
export const DEMO_MODE = true;

/** Backend API base URL */
export const BACKEND_URL = __DEV__
  ? "http://localhost:3001"
  : "https://snowball-api.example.com";

/** Solana Network */
export const SOLANA_NETWORK = "devnet";
export const SOLANA_RPC_URL = "https://api.devnet.solana.com";

/** Program ID — A kişisi deploy ettikten sonra güncellenir */
export const PROGRAM_ID = "PROGRAM_ID_PLACEHOLDER";

/** Explorer URL */
export const EXPLORER_BASE_URL = "https://explorer.solana.com";
export const getExplorerTxUrl = (txHash: string) =>
  `${EXPLORER_BASE_URL}/tx/${txHash}?cluster=${SOLANA_NETWORK}`;
export const getExplorerAddressUrl = (address: string) =>
  `${EXPLORER_BASE_URL}/address/${address}?cluster=${SOLANA_NETWORK}`;
