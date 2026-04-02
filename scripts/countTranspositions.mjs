/**
 * Count how many board positions (first FEN field) have more than one entry
 * in the opening book, and characterize the duplicates.
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

// Group all FENs by board position
const byPos = {};
for (const [fen, v] of Object.entries(all)) {
  const p = pos(fen);
  if (!byPos[p]) byPos[p] = [];
  byPos[p].push({ fen, ...v });
}

const total = Object.keys(all).length;
const uniquePositions = Object.keys(byPos).length;
const duplicatePositions = Object.entries(byPos).filter(
  ([, entries]) => entries.length > 1,
);

console.log(`Total FEN entries:        ${total}`);
console.log(`Unique board positions:   ${uniquePositions}`);
console.log(`Duplicate positions:      ${duplicatePositions.length}`);
console.log(`Extra FENs (duplicates):  ${total - uniquePositions}`);
console.log(
  `Duplication rate:         ${(((total - uniquePositions) / total) * 100).toFixed(1)}%`,
);

// How many duplicates involve different names vs same name?
let diffName = 0,
  sameName = 0,
  diffEco = 0;
for (const [, entries] of duplicatePositions) {
  const names = new Set(entries.map((e) => e.name));
  const ecos = new Set(entries.map((e) => e.eco));
  if (names.size > 1) diffName++;
  else sameName++;
  if (ecos.size > 1) diffEco++;
}
console.log(`\nOf duplicate positions:`);
console.log(`  Different names:  ${diffName}`);
console.log(`  Same name:        ${sameName}`);
console.log(`  Different ECO:    ${diffEco}`);

// Source combinations in duplicates
const srcComboCounts = {};
for (const [, entries] of duplicatePositions) {
  const srcs = entries
    .map((e) => e.src)
    .sort()
    .join("+");
  srcComboCounts[srcs] = (srcComboCounts[srcs] || 0) + 1;
}
console.log(`\nSource combinations in duplicate positions:`);
Object.entries(srcComboCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([combo, n]) => {
    console.log(`  ${n.toString().padStart(4)}  ${combo}`);
  });

// How many duplicates have 3+ FENs for the same board?
const byCount = {};
for (const [, entries] of duplicatePositions) {
  byCount[entries.length] = (byCount[entries.length] || 0) + 1;
}
console.log(`\nDuplicate FEN count per board position:`);
Object.entries(byCount)
  .sort((a, b) => a[0] - b[0])
  .forEach(([n, count]) => {
    console.log(`  ${n} FENs for same position: ${count} positions`);
  });

// Sample interesting cases: same position, different names, different ECO codes
console.log(
  `\nSample: different names AND different ECO codes for same position (first 10):`,
);
let shown = 0;
for (const [p, entries] of duplicatePositions) {
  const ecos = new Set(entries.map((e) => e.eco));
  if (ecos.size > 1 && shown < 10) {
    shown++;
    console.log(`  Position: ${p}`);
    entries.forEach((e) =>
      console.log(`    [${e.eco}] (${e.src}) "${e.name}"`),
    );
  }
}
