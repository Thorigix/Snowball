import { useSyncExternalStore } from "react";
import { getWalletSnapshot, subscribeWallet } from "@/services/wallet";

export function useWallet() {
  return useSyncExternalStore(
    subscribeWallet,
    getWalletSnapshot,
    getWalletSnapshot
  );
}
