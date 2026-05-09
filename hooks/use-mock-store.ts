/**
 * Reactive bindings for the mock-data store.
 * Components re-render whenever any mutation calls notify().
 */

import { useEffect, useSyncExternalStore } from "react";
import {
  allCampaigns,
  refreshCampaignsFromBackend,
  subscribe,
} from "@/services/mock-data";
import type { Campaign } from "@/types";

let snapshotVersion = 0;
let cachedSnapshot: readonly Campaign[] = allCampaigns.slice();

// We rebuild the snapshot reference on every notify so that React detects a
// change (the array contents are mutated in place by the store).
subscribe(() => {
  snapshotVersion += 1;
  cachedSnapshot = allCampaigns.slice();
});

function getSnapshot(): readonly Campaign[] {
  return cachedSnapshot;
}

function subscribeWrapper(onStoreChange: () => void): () => void {
  return subscribe(onStoreChange);
}

export function useCampaigns(): readonly Campaign[] {
  useEffect(() => {
    refreshCampaignsFromBackend();
  }, []);

  return useSyncExternalStore(subscribeWrapper, getSnapshot, getSnapshot);
}

export function useCampaign(id: string | undefined): Campaign | undefined {
  const campaigns = useCampaigns();
  if (!id) return undefined;
  return campaigns.find((c) => c.id === id);
}
