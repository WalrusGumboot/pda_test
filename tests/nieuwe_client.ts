import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PdaTest } from "../target/types/pda_test";

const { SystemProgram } = anchor.web3 // Herexport van de SystemProgram uit anchor.web3
import { PublicKey } from "@solana/web3.js";

const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");

const provider_devnet = new anchor.Provider(
    connection,
    anchor.Wallet.local(),
    {
        commitment: "confirmed",
        preflightCommitment: "confirmed"
    }
);

const walletPayer = anchor.Wallet.local().payer;

  
  // Daarna gaan we die provider ook echt gebruiken
anchor.setProvider(provider_devnet)

const program = anchor.workspace.PdaTest as Program<PdaTest>;

async function main() {
    const [bedrijfPDA, bump] = await PublicKey
      .findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("bedrijfpda"),
          provider_devnet.wallet.publicKey.toBytes()
        ],
        program.programId
      )
    

    console.log(bedrijfPDA, bump);

    const tx = await program.methods.maakBedrijf(
        "Jumbo N.V.",
        "Een supermarkt",
        "https://www.jumbo.nl",
        true,
        bump
    ).signers([walletPayer]).accounts(
      {
        bedrijf: bedrijfPDA,
        gebruiker: provider_devnet.wallet.publicKey,
        systemProgram: SystemProgram.programId
      }
    );

    let werkende_transactie = undefined;
    
    await tx.transaction().then(
      async (transactie) => {
        let recenteHash = await connection.getLatestBlockhash()

        transactie.recentBlockhash = recenteHash.blockhash
        transactie.sign(walletPayer)

        werkende_transactie = transactie;
        console.log("Succes: ", transactie);
      },
      (reden) => {console.log("Foutmelding: ", reden)}
    )

    console.log(werkende_transactie);

    await anchor.web3.sendAndConfirmTransaction(
      connection,
      werkende_transactie,
      [walletPayer],
      {commitment: "confirmed"}
    ).then(
      (str) => {
        console.log(str)
      },
      (reden) => {console.log("Foutmelding: ", reden)}
    )
}

main().then(() => {console.log("Success!!!! JOEPIEEE")})