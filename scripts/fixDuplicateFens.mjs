/**
 * fixDuplicateFens.mjs
 *
 * Removes two duplicate FEN entries from ecoA.json that also exist in other files:
 *   - A00 "Van Geet Opening: Caro-Kann Variation, St. Patrick's Attack" (also in B10)
 *   - A48 "Queen's Pawn Game: Barry Attack" (also in D00)
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const path = join(root, "ecoA.json");

const data = JSON.parse(readFileSync(path, "utf8"));

const toRemove = [
  "rnbqkbnr/pp2pppp/2p5/3p4/4P3/2N4P/PPPP1PP1/R1BQKBNR b KQkq - 0 3",
  "rnbqkb1r/ppp1pp1p/5np1/3p4/3P1B2/2N2N2/PPP1PPPP/R2QKB1R b KQkq - 1 4",
];

for (const fen of toRemove) {
  if (data[fen]) {
    console.log(`Removing [${data[fen].eco}] "${data[fen].name}"`);
    delete data[fen];
  } else {
    console.log(`Not found (already removed?): ${fen.slice(0, 60)}`);
  }
}

writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("Done.");
