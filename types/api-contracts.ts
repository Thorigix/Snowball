/**
 * Snowball — API Route Contracts
 * B kişisi mock ile, A kişisi gerçek endpointlerle kullanır.
 */

export const API_ROUTES = {
  health: "/api/health",
  campaign: "/api/campaign",
  lifiQuote: "/api/lifi/quote",
  elevenLabsSummaryAudio: "/api/elevenlabs/summary-audio",
};

export const API_BASE_URL = __DEV__
  ? "http://localhost:3001"
  : "https://snowball-api.example.com";
