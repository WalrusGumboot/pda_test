// CLIENT VOOR PDA-PROGRAMMA
// Geschreven door Simeon Duwel

// een paar libraries om logging mooier te maken
import chalk from 'chalk';
import ProgressBar from 'progress';

console.log(chalk.bold.bgBlue("PDA-programma met Anchor"))
console.log(chalk.bold.green("Initialiseren..."))

// We importeren de anchor bibliotheek
import * as anchor    from "@project-serum/anchor";
import { Program }    from "@project-serum/anchor"; // Herexports
import { PublicKey }  from "@solana/web3.js";
const  { SystemProgram } = anchor.web3

import { PdaTest } from "./target/types/pda_test";

interface BedrijfData {
  naam:         string,
  omschrijving: string,
  url:          string,
  geverifieerd: boolean
}

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
anchor.setProvider(provider_devnet);

const program = anchor.workspace.PdaTest as Program<PdaTest>;

async function maakNieuwBedrijf(id: number, data: BedrijfData) {
  var bar = new ProgressBar(
    `${chalk.cyanBright("Nieuw bedrijf aan het aanmaken")} [:bar] id: ${chalk.yellow(id)}`, {
      total: 4,
      width: 20,
      complete: '█',
      incomplete: '░'
    }
  )
  
  // allereerst deriveren we de PDA van het bedrijf, en slaan we de bump op
  const [bedrijfPDA, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("bedrijfpda"), // hiervoor hebben we deze seed nodig
        provider_devnet.wallet.publicKey.toBytes(),   // en de publicKey van de wallet
        Uint8Array.of(id)                             // en de ID van het bedrijf wat we willen maken
      ],
      program.programId // we leiden af vanaf ons huidige programma
    );
  bar.tick();

  const tx = await program.methods.maakBedrijf( // maakBedrijf is de belangrijkste methode.
      data.naam,
      data.omschrijving,
      data.url,
      data.geverifieerd,
      bump, // de bump die we vonden is nodig om ook door te geven aan het interne account
      id    
  ).signers([walletPayer]).accounts( // we geven de wallet door als een signer
    {
      bedrijf: bedrijfPDA,
      gebruiker: provider_devnet.wallet.publicKey,
      systemProgram: SystemProgram.programId
    }
  );
  bar.tick();
  

  // we willen de transactie nu ook gaan verzenden.
  let werkende_transactie = undefined;
  
  await tx.transaction().then(
    async (transactie) => {
      // van zodra dat we de functie uitgevoerd hebben krijgen we een Transaction-object...
      let recenteHash = await connection.getLatestBlockhash() // die nog een recente blockhash nodig heeft

      transactie.recentBlockhash = recenteHash.blockhash
      transactie.sign(walletPayer) // ook word de transactie daadwerkelijk gesignd

      werkende_transactie = transactie; // en we kennen de waarde toe aan de externe variabele
      //console.log("Succes: ", transactie);
    },
    (reden) => {console.log("Foutmelding: ", reden)}
  );
  bar.tick();
  
  // noot aan zelf: dit zou waarschijnlijk nog gerefactord kunnen worden als één enkele async functie
  //console.log(werkende_transactie);
  
  // nu versturen we daadwerkelijk de transactie intern.
  await anchor.web3.sendAndConfirmTransaction(
    connection,
    werkende_transactie,
    [walletPayer],
    {commitment: "confirmed"}
  ).then(
    (str) => {
      //console.log(str)
    },
    //(reden) => {console.log("Foutmelding: ", reden)}
  );

  bar.tick();
  console.log(chalk.greenBright("Aangemaakt!"));  
  console.log("  ├ Adres: ", chalk.yellow(bedrijfPDA.toBase58()))
  console.log("  └ Bump:  ", chalk.yellow(bump))
}

console.log(chalk.bold.green("  ├ klaar."))

console.log(chalk.bold.green("  └ runtime info:"))

console.log("    ├ wallet public key ", chalk.cyan(provider_devnet.wallet.publicKey.toBase58()))
//console.log("    ├ wallet secret key ", chalk.cyan(Buffer.from(walletPayer.secretKey).readBigUint64BE()))
console.log("    └ program ID        ", chalk.cyan(program.programId.toBase58()))



maakNieuwBedrijf(1, {
  naam: "Snackbar Tony",
  omschrijving: "De beste snacks van heel Hoofddorp!",
  url: "https://www.snackbartony.nl",
  geverifieerd: false
})