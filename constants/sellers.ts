export type SellerReputation = {
  verified: boolean;
  fulfilledOrders: number;
  disputeRate: string;
  deliverySla: string;
  verification: string;
};

const DEFAULT_REPUTATION: SellerReputation = {
  verified: false,
  fulfilledOrders: 4,
  disputeRate: "2.4%",
  deliverySla: "5-7 days",
  verification: "Demo seller profile",
};

const SELLER_REPUTATION: Record<string, SellerReputation> = {
  "NovaTech Istanbul": {
    verified: true,
    fulfilledOrders: 128,
    disputeRate: "0.8%",
    deliverySla: "3-5 days",
    verification: "KYC verified seller",
  },
  "AudioMax Electronics": {
    verified: true,
    fulfilledOrders: 76,
    disputeRate: "1.1%",
    deliverySla: "4-6 days",
    verification: "Verified electronics seller",
  },
  "KeyLab Studio": {
    verified: true,
    fulfilledOrders: 42,
    disputeRate: "1.9%",
    deliverySla: "6-8 days",
    verification: "Verified maker profile",
  },
};

export function getSellerReputation(sellerName: string): SellerReputation {
  return SELLER_REPUTATION[sellerName] ?? DEFAULT_REPUTATION;
}
