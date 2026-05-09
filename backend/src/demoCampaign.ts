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
}

export function getDemoCampaign(): DemoCampaign {
  return {
    id: "campaign-rtx-5080-demo",
    title: "RTX 5080 Group Buy",
    description:
      "Join three buyers to unlock a coordinated group purchase protected by Solana escrow.",
    sellerName: "NovaTech Istanbul",
    targetBuyers: 3,
    currentBuyers: 0,
    depositSol: 0.05,
    depositLamports: 50000000,
    releaseRule: "2 of 3 delivery confirmations release funds to the seller",
    status: "OPEN",
    network: "devnet",
    programId: process.env.PROGRAM_ID || "",
    lifiEnabled: true,
    elevenLabsEnabled: true,
  };
}
