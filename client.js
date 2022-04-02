// Allereerst importeren we de Anchor client-bibliotheek.

const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3 // Herexport van de SystemProgram uit anchor.web3
const { PublicKey }     = require("@solana/web3.js");

// We maken handmatig een nieuwe connectie met het devnet.
// Overal waar 'confirmed' staat bevestigt dat de connectie daadwerkelijk functioneert
// voordat we ermee gaan werken. Andere opties zijn o.a. 'single' en 'finalized'.
const provider_devnet = new anchor.Provider(
  new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed"),
  anchor.Wallet.local(),
  {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  }
);

// Daarna gaan we die provider ook echt gebruiken
anchor.setProvider(provider_devnet)

const wallet = provider_devnet.wallet; // we gebruiken de wallet die we daarnet ingegeven hebben

class BedrijfRef {
  constructor(adres, bump) {
    this.adres = adres,
    this.bump  = bump
  }
}

class AnchorProgramma {
  constructor() {
    // We hebben de IDL-definitie van ons programma nodig om
    // communicatie ermee te vermogenlijken.
    this.idl = JSON.parse(
      require("fs").readFileSync("./target/idl/pda_test.json", "utf8")
    );
    
    this.programId = new anchor.web3.PublicKey("A9RfydetpSqT5rLRZNmeVaeyqG84tXm8cNZkn6Zy1817");
    this.program   = new anchor.Program(this.idl, this.programId); // met de programma-id en de IDL hebben we genoeg info
  
    this.tekstAdres = undefined
    this.bump       = undefined
  }

  /// Deze functie derivet een Bibliotheek vanaf de Pubkey van de wallet.
  async nieuweOpslag(naam, omschrijving, url, geverifieerd) {
    const [bedrijfPDA, _] = await PublicKey
      .findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("bedrijfpda"),
          wallet.publicKey.toBuffer()
        ],
        this.programId
      );
    

    console.log(bedrijfPDA);

    let tx = await this.program.methods.maakBedrijf(naam, omschrijving, url, geverifieerd, {
      accounts: {
        gebruiker:     wallet.publicKey,
        bedrijf:       bedrijfPDA,
        systemProgram: SystemProgram.programId
      },
    });

    let name = await this.program.account.userStats.fetch(bedrijfPDA).name;
    console.log(name)

    await this.program.rpc.veranderBedrijfNaam("tom", {
      accounts: {
        gebruiker: wallet.publicKey,
        bedrijf:   bedrijfPDA,
      }
    })
  }
}

async function main() {
  let p = new AnchorProgramma();

  await p.nieuweOpslag("Jumbo N.V.", "Een supercoole supermarkt", "https://www.jumbo.nl", true);
}

console.log("Running client.");
main().then(() => console.log("Success"));