/**
 * For each ECO code where isEcoRoot is scid-sourced but an eco_tsv entry also
 * exists for the same code, check whether the two entries share the same board
 * position (first field of FEN) — i.e., are they transpositions?
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const files = ["ecoA.json", "ecoB.json", "ecoC.json", "ecoD.json", "ecoE.json"];
let all = {};
for (const f of files)
  Object.assign(all, JSON.parse(readFileSync(join(root, f))));

const pos = (fen) => fen.split(" ")[0];

const scidRoots = Object.entries(all).filter(
  ([, v]) => v.isEcoRoot && v.src === "scid",
);

let transpositions = 0;
let notTranspositions = 0;

for (const [scidFen, scidV] of scidRoots) {
  const ecoTsvForCode = Object.entries(all).filter(
    ([, v]) => v.eco === scidV.eco && v.src === "eco_tsv",
  );
  if (!ecoTsvForCode.length) continue;

  // Find the shortest eco_tsv entry (most likely the root-level one)
  const [tsvFen, tsvV] = ecoTsvForCode.sort(
    (a, b) => a[1].moves.length - b[1].moves.length,
  )[0];

  const samePos = pos(scidFen) === pos(tsvFen);
  const scidMoves = scidV.moves.split(" ").length;
  const tsvMoves = tsvV.moves.split(" ").length;

  if (samePos) {
    transpositions++;
    console.log(`TRANSPOSITION [${scidV.eco}]`);
    console.log(`  scid (root): "${scidV.name}"`);
    console.log(`               moves: ${scidV.moves}`);
    console.log(`  eco_tsv:     "${tsvV.name}"`);
    console.log(`               moves: ${tsvV.moves}`);
  } else {
    notTranspositions++;
    console.log(
      `DIFFERENT POS [${scidV.eco}] scid(${scidMoves}moves) vs eco_tsv(${tsvMoves}moves)`,
    );
    console.log(`  scid (root): "${scidV.name}"`);
    console.log(`               pos: ${pos(scidFen)}`);
    console.log(`  eco_tsv:     "${tsvV.name}"`);
    console.log(`               pos: ${pos(tsvFen)}`);
  }
}

console.log(
  `\nSummary: ${transpositions} transpositions, ${notTranspositions} different positions`,
);
