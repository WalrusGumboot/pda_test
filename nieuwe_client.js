"use strict";
// CLIENT VOOR PDA-PROGRAMMA
// Geschreven door Simeon Duwel
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// een paar libraries om logging mooier te maken
const chalk_1 = __importDefault(require("chalk"));
const progress_1 = __importDefault(require("progress"));
console.log(chalk_1.default.bold.bgBlue("PDA-programma met Anchor"));
console.log(chalk_1.default.bold.green("Initialiseren..."));
// We importeren de anchor bibliotheek
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const { SystemProgram } = anchor.web3;
// De verbinding die we gebruiken is met het devnet
const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
const provider_devnet = new anchor.Provider(connection, anchor.Wallet.local(), {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
});
const walletPayer = anchor.Wallet.local().payer;
// Daarna gaan we die provider ook echt gebruiken
anchor.setProvider(provider_devnet);
const program = anchor.workspace.PdaTest;
function maakNieuwBedrijf(id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var bar = new progress_1.default(`${chalk_1.default.cyanBright("Nieuw bedrijf aan het aanmaken")} [:bar] id: ${chalk_1.default.yellow(id)}`, {
            total: 4,
            width: 20,
            complete: '█',
            incomplete: '░'
        });
        // allereerst deriveren we de PDA van het bedrijf, en slaan we de bump op
        const [bedrijfPDA, bump] = yield web3_js_1.PublicKey.findProgramAddress([
            anchor.utils.bytes.utf8.encode("bedrijfpda"),
            provider_devnet.wallet.publicKey.toBytes(),
            Uint8Array.of(id) // en de ID van het bedrijf wat we willen maken
        ], program.programId // we leiden af vanaf ons huidige programma
        );
        bar.tick();
        const tx = yield program.methods.maakBedrijf(// maakBedrijf is de belangrijkste methode.
        data.naam, data.omschrijving, data.url, data.geverifieerd, bump, // de bump die we vonden is nodig om ook door te geven aan het interne account
        id).signers([walletPayer]).accounts(// we geven de wallet door als een signer
        {
            bedrijf: bedrijfPDA,
            gebruiker: provider_devnet.wallet.publicKey,
            systemProgram: SystemProgram.programId
        });
        bar.tick();
        // we willen de transactie nu ook gaan verzenden.
        let werkende_transactie = undefined;
        yield tx.transaction().then((transactie) => __awaiter(this, void 0, void 0, function* () {
            // van zodra dat we de functie uitgevoerd hebben krijgen we een Transaction-object...
            let recenteHash = yield connection.getLatestBlockhash(); // die nog een recente blockhash nodig heeft
            transactie.recentBlockhash = recenteHash.blockhash;
            transactie.sign(walletPayer); // ook word de transactie daadwerkelijk gesignd
            werkende_transactie = transactie; // en we kennen de waarde toe aan de externe variabele
            //console.log("Succes: ", transactie);
        }), (reden) => { console.log("Foutmelding: ", reden); });
        bar.tick();
        // noot aan zelf: dit zou waarschijnlijk nog gerefactord kunnen worden als één enkele async functie
        //console.log(werkende_transactie);
        // nu versturen we daadwerkelijk de transactie intern.
        yield anchor.web3.sendAndConfirmTransaction(connection, werkende_transactie, [walletPayer], { commitment: "confirmed" }).then((str) => {
            //console.log(str)
        });
        bar.tick();
        console.log(chalk_1.default.greenBright("Aangemaakt!"));
        console.log("  ├ Adres: ", chalk_1.default.yellow(bedrijfPDA.toBase58()));
        console.log("  └ Bump:  ", chalk_1.default.yellow(bump));
    });
}
console.log(chalk_1.default.bold.green("  ├ klaar."));
console.log(chalk_1.default.bold.green("  └ runtime info"));
console.log("    ├ wallet public key ", chalk_1.default.cyan(provider_devnet.wallet.publicKey.toBase58()));
//console.log("    ├ wallet secret key ", chalk.cyan(Buffer.from(walletPayer.secretKey).readBigUint64BE()))
console.log("    └ program ID        ", chalk_1.default.cyan(program.programId.toBase58()));
maakNieuwBedrijf(1, {
    naam: "Snackbar Tony",
    omschrijving: "De beste snacks van heel Hoofddorp!",
    url: "https://www.snackbartony.nl",
    geverifieerd: false
});
