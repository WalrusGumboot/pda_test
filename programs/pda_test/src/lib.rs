use anchor_lang::prelude::*;

const MAX_LENGTE_NAAM:         usize = 50;
const MAX_LENGTE_OMSCHRIJVING: usize = 200;
const MAX_LENGTE_URL:          usize = 50;

declare_id!("A9RfydetpSqT5rLRZNmeVaeyqG84tXm8cNZkn6Zy1817");

#[program]
pub mod pda_test {
    use super::*;

    pub fn maak_bedrijf(ctx: Context<MaakBedrijf>, naam: String, omschrijving: String, url: String, geverifieerd: bool, bump: u8) -> Result<()> {
        let bedrijf = &mut ctx.accounts.bedrijf;

        require!(naam.len()         < MAX_LENGTE_NAAM,         BedrijfError::BedrijfsnaamTeLang);
        require!(omschrijving.len() < MAX_LENGTE_OMSCHRIJVING, BedrijfError::OmschrijvingTeLang);
        require!(url.len()          < MAX_LENGTE_URL,          BedrijfError::UrlTeLang);

        bedrijf.bump     = bump;
        bedrijf.eigenaar = ctx.accounts.gebruiker.key();
        
        bedrijf.naam         = naam;
        bedrijf.omschrijving = omschrijving;
        bedrijf.url          = url;
        bedrijf.geverifieerd = geverifieerd;
        
        Ok(())
    }

    // handler function (add this next to the create_user_stats function in the game module)
    pub fn verander_bedrijf_naam(ctx: Context<ChangeUserName>, nieuwe_naam: String) -> Result<()> {
        require!(nieuwe_naam.as_bytes().len() > 200, BedrijfError::BedrijfsnaamTeLang);

        ctx.accounts.bedrijf.naam = nieuwe_naam;
        Ok(())
    }
}

#[account]
pub struct Bedrijf {
    bump: u8,
    eigenaar: Pubkey,

    naam:         String,
    omschrijving: String,
    url:          String,
    geverifieerd: bool
}

impl Bedrijf {
    pub fn ruimte() -> usize {
        32 + // een Pubkey is 32 bytes lang
        1  + // de bump is een u8

        4 + MAX_LENGTE_NAAM +         // 4 bytes string discriminator + max lengte v/d string
        4 + MAX_LENGTE_OMSCHRIJVING + // ditto
        4 + MAX_LENGTE_URL +          // ditto
        1 // een bool wordt weergegeven als een u8, dus ook één byte (zie ook: https://github.com/near/borsh)
    }
}

// validation struct
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct MaakBedrijf<'info> {
    #[account(mut)]
    pub gebruiker: Signer<'info>,

    #[account(
        init,
        payer = gebruiker,
        space = 8 + Bedrijf::ruimte(), 
        seeds = [b"bedrijfpda", gebruiker.key().as_ref()],
        bump
    )]
    pub bedrijf: Account<'info, Bedrijf>,
    pub system_program: Program<'info, System>,
}

// validation struct
#[derive(Accounts)]
pub struct ChangeUserName<'info> {
    pub gebruiker: Signer<'info>,
    #[account(mut, seeds = [b"bedrijfpda", gebruiker.key().as_ref()], bump = bedrijf.bump)]
    pub bedrijf: Account<'info, Bedrijf>,
}

#[error_code]
pub enum BedrijfError {
    #[msg(format!("De opgegeven bedrijfsnaam is langer dan {MAX_LENGTE_NAAM} karakters."))]
    BedrijfsnaamTeLang,

    #[msg(format!("De opgegeven omschrijving is langer dan {MAX_LENGTE_OMSCHRIJVING} karakters."))]
    OmschrijvingTeLang,
    
    #[msg(format!("De opgegeven URL is langer dan {MAX_LENGTE_URL} karakters."))]
    UrlTeLang,
}