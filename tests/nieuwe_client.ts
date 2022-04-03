// CLIENT VOOR PDA-PROGRAMMA
// Geschreven door Simeon Duwel

// We importeren de anchor bibliotheek
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor"; // Herexports
import { PublicKey } from "@solana/web3.js";
const { SystemProgram } = anchor.web3

import { PdaTest } from "../target/types/pda_test";

// De verbinding die we gebruiken is met het devnet
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

    // allereerst deriveren we de PDA van het bedrijf, en slaan we de bump op
    const [bedrijfPDA, bump] = await PublicKey
      .findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("bedrijfpda"), // hiervoor hebben we deze seed nodig
          provider_devnet.wallet.publicKey.toBytes()    // en de publicKey van de wallet
        ],
        program.programId // we leiden af vanaf ons huidige programma
      )
    

    console.log(bedrijfPDA, bump);

    const tx = await program.methods.maakBedrijf( // maakBedrijf is de belangrijkste methode.
        "Jumbo N.V.", 
        "Een supermarkt",
        "https://www.jumbo.nl",
        true,
        bump // de bump die we vonden is nodig om ook door te geven aan het interne account
    ).signers([walletPayer]).accounts( // we geven de wallet door als een signer
      {
        bedrijf: bedrijfPDA,
        gebruiker: provider_devnet.wallet.publicKey,
        systemProgram: SystemProgram.programId
      }
    );


    // we willen de transactie nu ook gaan verzenden.
    let werkende_transactie = undefined;
    
    await tx.transaction().then(
      async (transactie) => {
        // van zodra dat we de functie uitgevoerd hebben krijgen we een Transaction-object...
        let recenteHash = await connection.getLatestBlockhash() // die nog een recente blockhash nodig heeft

        transactie.recentBlockhash = recenteHash.blockhash
        transactie.sign(walletPayer) // ook word de transactie daadwerkelijk gesignd

        werkende_transactie = transactie; // en we kennen de waarde toe aan de externe variabele
        console.log("Succes: ", transactie);
      },
      (reden) => {console.log("Foutmelding: ", reden)}
    )
    
    // noot aan zelf: dit zou waarschijnlijk nog gerefactord kunnen worden als één enkele async functie
    console.log(werkende_transactie);
    
    // nu versturen we daadwerkelijk de transactie intern.
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
