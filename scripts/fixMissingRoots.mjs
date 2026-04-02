/**
 * Fix two data errors in eco.json ECO category files:
 * 1. 6 entries have trailing whitespace in their `eco` (and `name`) fields
 * 2. 3 ECO codes (A74, B85, D71) have no isEcoRoot entry — add it to the
 *    shortest eco_tsv entry for each code
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const files = ["ecoA.json", "ecoB.json", "ecoC.json", "ecoD.json", "ecoE.json"];

// Load all files; track which file each FEN lives in
const fileData = {}; // filename -> parsed object
const fenFile = {}; // fen -> filename
for (const f of files) {
  const data = JSON.parse(readFileSync(join(root, f)));
  fileData[f] = data;
  for (const fen of Object.keys(data)) fenFile[fen] = f;
}

// Merge all into one view for candidate lookup
const all = Object.assign({}, ...Object.values(fileData));

// ─── Fix 1: trim trailing whitespace from eco + name fields ───────────────
let trimCount = 0;
for (const [f, data] of Object.entries(fileData)) {
  for (const [fen, v] of Object.entries(data)) {
    let changed = false;
    if (v.eco !== v.eco.trim()) {
      console.log(`TRIM eco in ${f}: |${v.eco}| -> |${v.eco.trim()}|`);
      v.eco = v.eco.trim();
      changed = true;
    }
    if (typeof v.name === "string" && v.name !== v.name.trim()) {
      console.log(`TRIM name in ${f}: |${v.name}| -> |${v.name.trim()}|`);
      v.name = v.name.trim();
      changed = true;
    }
    if (changed) trimCount++;
  }
}
console.log(`\n${trimCount} entries trimmed.`);

// ─── Fix 2: add isEcoRoot to the missing three codes ──────────────────────
// For each code, pick the shortest eco_tsv entry (fewest characters in moves).
// If no eco_tsv entry exists, pick the shortest entry from any source.
const missingRootCodes = ["A74", "B85", "D71"];
let rootsAdded = 0;

for (const eco of missingRootCodes) {
  // Re-scan the (now-trimmed) data
  const candidates = Object.entries(all).filter(([, v]) => v.eco === eco);
  const ecoTsvCandidates = candidates.filter(([, v]) => v.src === "eco_tsv");
  const pool = ecoTsvCandidates.length ? ecoTsvCandidates : candidates;
  const [fen, v] = pool.sort(
    (a, b) => a[1].moves.length - b[1].moves.length,
  )[0];

  const f = fenFile[fen];
  fileData[f][fen].isEcoRoot = true;
  rootsAdded++;
  console.log(`\nADDED isEcoRoot for ${eco} in ${f}:`);
  console.log(`  name: "${v.name}"`);
  console.log(`  moves: ${v.moves}`);
  console.log(`  fen: ${fen}`);
}
console.log(`\n${rootsAdded} isEcoRoot entries added.`);

// ─── Write updated files ───────────────────────────────────────────────────
for (const [f, data] of Object.entries(fileData)) {
  writeFileSync(join(root, f), JSON.stringify(data, null, 2) + "\n");
}
console.log(`\nAll files written.`);
