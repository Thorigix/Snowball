/**
 * Snowball — API Route Contracts
 * B kişisi mock ile, A kişisi gerçek endpointlerle kullanır.
 */

export const API_ROUTES = {
  campaigns: "/api/campaigns",
  campaignDetail: (id: string) => `/api/campaigns/${id}`,
  lifiQuote: "/api/lifi/quote",
  aiCampaignSummary: "/api/ai/campaign-summary",
  aiRiskSummary: "/api/ai/risk-summary",
  deliveryQr: (id: string) => `/api/campaigns/${id}/delivery-qr`,
};

export const API_BASE_URL = __DEV__
  ? "http://localhost:3001"
  : "https://snowball-api.example.com";
