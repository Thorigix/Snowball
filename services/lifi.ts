import { fetchLifiQuote } from "@/services/backend";

export async function getLifiQuote(params: {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress?: string;
  toAddress?: string;
}) {
  return fetchLifiQuote(params);
}
