#!/usr/bin/env node
/**
 * Génère les deux variables nécessaires à l'administration, sans jamais enregistrer le mot de passe :
 *   node scripts/hash-password.mjs
 * Le mot de passe est saisi sans affichage (12 caractères minimum). Copiez les deux lignes affichées dans .env.local
 * ou dans les variables d'environnement de l'hébergeur.
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import readline from "node:readline";

const scrypt = promisify(scryptCb);
const N = 32768, R = 8, P = 1, LEN = 64;

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = rl._writeToOutput;
    rl._writeToOutput = (s) => (s.includes(question) ? write.call(rl, s) : write.call(rl, ""));
    rl.question(question, (a) => {
      rl.close();
      process.stdout.write("\n");
      resolve(a);
    });
  });
}

const password = process.env.ADMIN_PASSWORD ?? (await ask("Mot de passe administrateur (12 caractères minimum) : "));
if (password.length < 12) {
  console.error("Mot de passe trop court : 12 caractères minimum.");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = await scrypt(password, salt, LEN, { N, r: R, p: P, maxmem: 128 * N * R * 2 });
console.log("\nAjoutez ces deux lignes à .env.local (entre guillemets simples à cause des $ éventuels) :\n");
console.log(`ADMIN_PASSWORD_HASH='${["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join(":")}'`);
console.log(`ADMIN_SESSION_SECRET='${randomBytes(48).toString("base64url")}'`);
console.log("\nChanger ADMIN_SESSION_SECRET déconnecte toutes les sessions en cours.");
