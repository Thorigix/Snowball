import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { SnowballEscrow } from "../target/types/snowball_escrow";

describe("snowball_escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.snowballEscrow as Program<SnowballEscrow>;

  it("Initializes Snowball escrow program", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
