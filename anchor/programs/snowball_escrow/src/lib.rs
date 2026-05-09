use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("2CvWVs51VW8mKGX8nk1PujUeFWFEPMZU1mi86vAdXcss");

#[program]
pub mod snowball_escrow {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        seller: Pubkey,
        target_buyers: u8,
        deposit_lamports: u64,
    ) -> Result<()> {
        require!(target_buyers > 1, SnowballError::InvalidTargetBuyers);
        require!(deposit_lamports > 0, SnowballError::InvalidDepositAmount);

        let campaign = &mut ctx.accounts.campaign;
        campaign.creator = ctx.accounts.creator.key();
        campaign.seller = seller;
        campaign.target_buyers = target_buyers;
        campaign.current_buyers = 0;
        campaign.deposit_lamports = deposit_lamports;
        campaign.total_deposited = 0;
        campaign.confirmations = 0;
        campaign.status = CampaignStatus::Open;
        campaign.bump = ctx.bumps.campaign;

        Ok(())
    }

    pub fn join_campaign(ctx: Context<JoinCampaign>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;

        require!(
            campaign.status == CampaignStatus::Open,
            SnowballError::CampaignNotOpen
        );
        require_keys_neq!(
            ctx.accounts.buyer.key(),
            campaign.seller,
            SnowballError::BuyerCannotBeSeller
        );
        require!(
            campaign.current_buyers < campaign.target_buyers,
            SnowballError::CampaignFull
        );

        let deposit_lamports = campaign.deposit_lamports;

        let cpi_accounts = system_program::Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: campaign.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.system_program.key(), cpi_accounts);
        system_program::transfer(cpi_ctx, deposit_lamports)?;

        let contribution = &mut ctx.accounts.contribution;
        contribution.campaign = campaign.key();
        contribution.buyer = ctx.accounts.buyer.key();
        contribution.amount = deposit_lamports;
        contribution.confirmed = false;
        contribution.refunded = false;
        contribution.bump = ctx.bumps.contribution;

        campaign.current_buyers = campaign
            .current_buyers
            .checked_add(1)
            .ok_or(SnowballError::ArithmeticOverflow)?;
        campaign.total_deposited = campaign
            .total_deposited
            .checked_add(deposit_lamports)
            .ok_or(SnowballError::ArithmeticOverflow)?;

        if campaign.current_buyers == campaign.target_buyers {
            campaign.status = CampaignStatus::Funded;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Campaign::SIZE,
        seeds = [b"campaign", creator.key().as_ref()],
        bump,
    )]
    pub campaign: Account<'info, Campaign>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinCampaign<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        init,
        payer = buyer,
        space = 8 + Contribution::SIZE,
        seeds = [b"contribution", campaign.key().as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub contribution: Account<'info, Contribution>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Campaign {
    pub creator: Pubkey,
    pub seller: Pubkey,
    pub target_buyers: u8,
    pub current_buyers: u8,
    pub deposit_lamports: u64,
    pub total_deposited: u64,
    pub confirmations: u8,
    pub status: CampaignStatus,
    pub bump: u8,
}

impl Campaign {
    pub const SIZE: usize = 32 + 32 + 1 + 1 + 8 + 8 + 1 + 1 + 1;
}

#[account]
pub struct Contribution {
    pub campaign: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub confirmed: bool,
    pub refunded: bool,
    pub bump: u8,
}

impl Contribution {
    pub const SIZE: usize = 32 + 32 + 8 + 1 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum CampaignStatus {
    Open,
    Funded,
    Shipped,
    Released,
    Refunded,
}

#[error_code]
pub enum SnowballError {
    #[msg("Target buyers must be greater than 1")]
    InvalidTargetBuyers,
    #[msg("Deposit amount must be greater than 0")]
    InvalidDepositAmount,
    #[msg("Campaign is not open")]
    CampaignNotOpen,
    #[msg("Campaign is already full")]
    CampaignFull,
    #[msg("Buyer cannot be the seller")]
    BuyerCannotBeSeller,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
