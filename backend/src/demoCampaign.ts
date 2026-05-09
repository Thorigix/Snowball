export interface DemoCampaign {
  id: string;
  title: string;
  description: string;
  sellerName: string;
  targetBuyers: number;
  currentBuyers: number;
  depositSol: number;
  depositLamports: number;
  releaseRule: string;
  status: string;
  network: string;
  programId: string;
  lifiEnabled: boolean;
  elevenLabsEnabled: boolean;
  confirmationsCount: number;
  totalDepositedSol: number;
  txHistory: DemoTx[];
}

export interface DemoTx {
  id: string;
  type: "join" | "mark_shipped" | "confirm_delivery" | "release_funds" | "reset";
  createdAt: string;
  note: string;
}

export interface DemoMutationResult {
  success: boolean;
  txHash: string;
  campaign: DemoCampaign;
  error?: string;
}

function initialCampaign(): DemoCampaign {
  const depositSol = 0.05;
  const currentBuyers = 2;

  return {
    id: "campaign-rtx-5080-demo",
    title: "RTX 5080 Group Buy",
    description:
      "Join three buyers to unlock a coordinated group purchase protected by Solana escrow.",
    sellerName: "NovaTech Istanbul",
    targetBuyers: 3,
    currentBuyers,
    depositSol,
    depositLamports: 50000000,
    releaseRule: "2 of 3 delivery confirmations release funds to the seller",
    status: "OPEN",
    network: "devnet",
    programId: process.env.PROGRAM_ID || "",
    lifiEnabled: true,
    elevenLabsEnabled: true,
    confirmationsCount: 0,
    totalDepositedSol: Number((currentBuyers * depositSol).toFixed(2)),
    txHistory: [],
  };
}

let demoCampaign = initialCampaign();

function makeDemoTx(type: DemoTx["type"], note: string): string {
  const id = `demo-${type}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  demoCampaign.txHistory.unshift({
    id,
    type,
    createdAt: new Date().toISOString(),
    note,
  });

  return id;
}

function mutationSuccess(txHash: string): DemoMutationResult {
  return {
    success: true,
    txHash,
    campaign: getDemoCampaign(),
  };
}

function mutationError(error: string): DemoMutationResult {
  return {
    success: false,
    txHash: "",
    campaign: getDemoCampaign(),
    error,
  };
}

export function getDemoCampaign(): DemoCampaign {
  return { ...demoCampaign, txHistory: [...demoCampaign.txHistory] };
}

export function joinDemoCampaign(): DemoMutationResult {
  if (demoCampaign.status !== "OPEN") {
    return mutationError("Campaign is not open");
  }
  if (demoCampaign.currentBuyers >= demoCampaign.targetBuyers) {
    return mutationError("Campaign is full");
  }

  demoCampaign.currentBuyers += 1;
  demoCampaign.totalDepositedSol = Number(
    (demoCampaign.currentBuyers * demoCampaign.depositSol).toFixed(2)
  );

  if (demoCampaign.currentBuyers >= demoCampaign.targetBuyers) {
    demoCampaign.status = "FUNDED";
  }

  const txHash = makeDemoTx(
    "join",
    `Buyer deposited ${demoCampaign.depositSol} devnet SOL into demo escrow`
  );

  return mutationSuccess(txHash);
}

export function markDemoCampaignShipped(): DemoMutationResult {
  if (demoCampaign.status !== "FUNDED") {
    return mutationError("Campaign must be funded before marking shipped");
  }

  demoCampaign.status = "SHIPPED";
  const txHash = makeDemoTx("mark_shipped", "Seller marked the demo order as shipped");
  return mutationSuccess(txHash);
}

export function confirmDemoDelivery(): DemoMutationResult {
  if (
    demoCampaign.status !== "SHIPPED" &&
    demoCampaign.status !== "DELIVERY_REVIEW"
  ) {
    return mutationError("Campaign is not awaiting delivery confirmation");
  }

  demoCampaign.confirmationsCount = Math.min(
    demoCampaign.targetBuyers,
    demoCampaign.confirmationsCount + 1
  );
  demoCampaign.status = "DELIVERY_REVIEW";

  const txHash = makeDemoTx(
    "confirm_delivery",
    `${demoCampaign.confirmationsCount} buyer confirmation(s) recorded`
  );

  return mutationSuccess(txHash);
}

export function releaseDemoFunds(): DemoMutationResult {
  if (
    demoCampaign.status !== "SHIPPED" &&
    demoCampaign.status !== "DELIVERY_REVIEW"
  ) {
    return mutationError("Campaign is not in a releasable state");
  }
  if (demoCampaign.confirmationsCount < 2) {
    return mutationError("Need at least 2 delivery confirmations");
  }

  demoCampaign.status = "RELEASED";
  const txHash = makeDemoTx(
    "release_funds",
    `${demoCampaign.totalDepositedSol} devnet SOL released to seller in demo state`
  );

  return mutationSuccess(txHash);
}

export function resetDemoCampaign(): DemoMutationResult {
  demoCampaign = initialCampaign();
  const txHash = makeDemoTx("reset", "Demo campaign state reset");
  return mutationSuccess(txHash);
}
