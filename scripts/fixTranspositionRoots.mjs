/**
 * Step 3: Fix isEcoRoot on 32 transposition cases.
 *
 * For each ECO code where isEcoRoot is on a SCID-sourced FEN but an eco_tsv
 * FEN exists for the identical board position (same first FEN field), move
 * isEcoRoot from the SCID entry to the eco_tsv entry.
 *
 * Neither entry is deleted. fromTo.json is unaffected.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const files = ["ecoA.json", "ecoB.json", "ecoC.json", "ecoD.json", "ecoE.json"];

const fileData = {};
const fenFile = {};
for (const f of files) {
  const data = JSON.parse(readFileSync(join(root, f)));
  fileData[f] = data;
  for (const fen of Object.keys(data)) fenFile[fen] = f;
}

const all = Object.assign({}, ...Object.values(fileData));
const pos = (fen) => fen.split(" ")[0];

// Find all SCID isEcoRoot entries that have an eco_tsv entry at the same position
const scidRoots = Object.entries(all).filter(
  ([, v]) => v.isEcoRoot && v.src === "scid",
);

let fixed = 0;
let skipped = 0;

for (const [scidFen, scidV] of scidRoots) {
  const scidPos = pos(scidFen);

  // Find eco_tsv entries for the same ECO code at the same board position
  const tsvMatches = Object.entries(all).filter(
    ([fen, v]) =>
      v.src === "eco_tsv" && v.eco === scidV.eco && pos(fen) === scidPos,
  );

  if (tsvMatches.length === 0) {
    skipped++;
    continue;
  }

  // If multiple eco_tsv matches (shouldn't happen but be safe), pick shortest moves
  const [tsvFen, tsvV] = tsvMatches.sort(
    (a, b) => a[1].moves.length - b[1].moves.length,
  )[0];

  // Move isEcoRoot from SCID FEN to eco_tsv FEN
  delete fileData[fenFile[scidFen]][scidFen].isEcoRoot;
  fileData[fenFile[tsvFen]][tsvFen].isEcoRoot = true;

  fixed++;
  console.log(`[${scidV.eco}] isEcoRoot moved:`);
  console.log(`  FROM (scid):    "${scidV.name}"`);
  console.log(`                  ${scidFen}`);
  console.log(`  TO   (eco_tsv): "${tsvV.name}"`);
  console.log(`                  ${tsvFen}`);
}

console.log(`\n${fixed} isEcoRoot entries moved to eco_tsv FENs.`);
console.log(
  `${skipped} SCID roots skipped (no eco_tsv entry at same position — correct as-is).`,
);

// Write updated files
for (const [f, data] of Object.entries(fileData)) {
  writeFileSync(join(root, f), JSON.stringify(data, null, 2) + "\n");
}
console.log(`\nAll files written.`);
