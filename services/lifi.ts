/**
 * LI.FI Service
 * Real API integration for cross-chain routing.
 */

const API_BASE = "https://li.quest/v1";

export async function getLifiQuote(params: {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress?: string;
}) {
  const { fromChain, toChain, fromToken, toToken, fromAmount, fromAddress } = params;
  
  // Mapping display names to LI.FI chain IDs/keys if necessary
  // For simplicity, we assume the display names match or are handled by the API
  
  const query = new URLSearchParams({
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromAmount,
    fromAddress: fromAddress || "0x0000000000000000000000000000000000000000", // dummy for quote
  });

  try {
    const response = await fetch(`${API_BASE}/quote?${query.toString()}`);
    const data = await response.json();
    
    if (data.errors || data.message) {
      console.warn("[LI.FI] API Error:", data);
      throw new Error(data.message || "Failed to fetch LI.FI quote");
    }
    
    return data;
  } catch (error) {
    console.error("[LI.FI] Fetch Error:", error);
    throw error;
  }
}
