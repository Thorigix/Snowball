use anchor_lang::prelude::*;

declare_id!("2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss");

#[program]
pub mod snowball_escrow {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
