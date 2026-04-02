import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const files = ["ecoA.json", "ecoB.json", "ecoC.json", "ecoD.json", "ecoE.json"];
let all = {};
const fileMap = {};
for (const f of files) {
  const data = JSON.parse(readFileSync(join(root, f)));
  for (const fen of Object.keys(data)) fileMap[fen] = f;
  Object.assign(all, data);
}

// Check for ECO codes with trailing/leading whitespace
const badEcos = new Set();
for (const [fen, v] of Object.entries(all)) {
  if (v.eco !== v.eco.trim()) {
    badEcos.add(v.eco);
  }
}
console.log("ECO codes with whitespace:", badEcos.size);
[...badEcos].sort().forEach((e) => console.log(`  |${e}| len=${e.length}`));

// True missing: ECO codes (trimmed) with no isEcoRoot anywhere
const rootEcosTrimmed = new Set(
  Object.values(all)
    .filter((v) => v.isEcoRoot)
    .map((v) => v.eco.trim()),
);
const allEcosTrimmed = [
  ...new Set(Object.values(all).map((v) => v.eco.trim())),
].sort();
const trulyMissing = allEcosTrimmed.filter(
  (e) => e !== "A00" && !rootEcosTrimmed.has(e),
);
console.log("\nTruly missing isEcoRoot (excluding A00):", trulyMissing.length);
console.log(trulyMissing.join(" "));

// Find candidate for each truly missing code
console.log("\n--- Candidates for truly missing roots ---");
for (const eco of trulyMissing) {
  const entries = Object.entries(all).filter(([, v]) => v.eco.trim() === eco);
  const ecoTsvEntries = entries.filter(([, v]) => v.src === "eco_tsv");
  const shortest = [...entries].sort(
    (a, b) => a[1].moves.length - b[1].moves.length,
  );
  const shortestEcoTsv = ecoTsvEntries.sort(
    (a, b) => a[1].moves.length - b[1].moves.length,
  );
  console.log(`\n${eco}:`);
  if (shortestEcoTsv.length) {
    const [fen, v] = shortestEcoTsv[0];
    console.log(`  CANDIDATE (eco_tsv, shortest): "${v.name}"`);
    console.log(`    moves: ${v.moves}`);
    console.log(`    file: ${fileMap[fen]}`);
    console.log(`    fen: ${fen}`);
  } else {
    const [fen, v] = shortest[0];
    console.log(`  CANDIDATE (${v.src}, shortest): "${v.name}"`);
    console.log(`    moves: ${v.moves}`);
    console.log(`    file: ${fileMap[fen]}`);
    console.log(`    fen: ${fen}`);
  }
}

// Also report: isEcoRoot entries that have wrong src (scid instead of eco_tsv)
// where an eco_tsv entry also exists for the same ECO code
console.log(
  "\n--- isEcoRoot entries sourced from scid where eco_tsv alternative exists ---",
);
const scidRoots = Object.entries(all).filter(
  ([, v]) => v.isEcoRoot && v.src === "scid",
);
for (const [fen, v] of scidRoots) {
  const ecoTsvForCode = Object.values(all).filter(
    (x) => x.eco.trim() === v.eco.trim() && x.src === "eco_tsv",
  );
  if (ecoTsvForCode.length > 0) {
    const shortestTsv = ecoTsvForCode.sort(
      (a, b) => a.moves.length - b.moves.length,
    )[0];
    console.log(`  [${v.eco}] current root (scid): "${v.name}"`);
    console.log(`         eco_tsv alternative:   "${shortestTsv.name}"`);
  }
}
