import { fetchLifiQuote } from "@/services/backend";

export async function getLifiQuote(params: {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress?: string;
}) {
  return fetchLifiQuote({
    ...params,
    fromAddress:
      params.fromAddress || "0x0000000000000000000000000000000000000000",
  });
}
