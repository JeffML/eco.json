/**
 * compareRootNames.mjs
 *
 * Compares isEcoRoot names before our changes (f398993) vs current state.
 * Shows old root name (source) → new root name (source) for all affected codes.
 * Also shows the "keep SCID" borderline cases with nearby eco_tsv entries.
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ECO_FILES = [
  "ecoA.json",
  "ecoB.json",
  "ecoC.json",
  "ecoD.json",
  "ecoE.json",
];
const BASE_COMMIT = "f398993";

// Load current data
const current = {};
for (const f of ECO_FILES) {
  Object.assign(current, JSON.parse(readFileSync(join(root, f), "utf8")));
}

// Load data from before our changes (write to temp files to avoid buffer limits)
import { writeFileSync } from "fs";
import { tmpdir } from "os";
const before = {};
for (const f of ECO_FILES) {
  const tmpPath = join(tmpdir(), `eco_before_${f}`);
  execSync(`git -C "${root}" show ${BASE_COMMIT}:${f} > "${tmpPath}"`);
  Object.assign(before, JSON.parse(readFileSync(tmpPath, "utf8")));
}

// Find all ECO codes where the isEcoRoot FEN changed
const beforeRoots = {};
const currentRoots = {};

for (const [fen, entry] of Object.entries(before)) {
  if (entry.isEcoRoot)
    beforeRoots[entry.eco] = { fen, name: entry.name, src: entry.src };
}
for (const [fen, entry] of Object.entries(current)) {
  if (entry.isEcoRoot)
    currentRoots[entry.eco] = { fen, name: entry.name, src: entry.src };
}

const changed = [];
const unchanged = [];

const allCodes = new Set([
  ...Object.keys(beforeRoots),
  ...Object.keys(currentRoots),
]);
for (const eco of [...allCodes].sort()) {
  const b = beforeRoots[eco];
  const c = currentRoots[eco];
  if (!b || !c) continue;
  if (b.fen !== c.fen || b.name !== c.name) {
    changed.push({ eco, before: b, after: c });
  }
}

console.log(`\n=== Changed roots (${changed.length} ECO codes) ===\n`);
for (const { eco, before: b, after: a } of changed) {
  const nameChanged = b.name !== a.name;
  console.log(`[${eco}]`);
  console.log(`  BEFORE (${b.src}): "${b.name}"`);
  console.log(`  AFTER  (${a.src}): "${a.name}"`);
  if (!nameChanged) console.log(`  (name unchanged — only source/FEN moved)`);
  console.log();
}

// Also show the "keep SCID" borderline cases with nearby eco_tsv entries for comparison
const BORDERLINE = ["B54", "B56", "C32", "C77", "D56", "D89"];
console.log(
  `\n=== "Keep SCID" borderline cases — SCID root vs eco_tsv neighbours ===\n`,
);
for (const eco of BORDERLINE) {
  const root_ = currentRoots[eco];
  const ecoTsvEntries = Object.entries(current)
    .filter(([, v]) => v.eco === eco && v.src === "eco_tsv")
    .sort((a, b) => a[1].moves.length - b[1].moves.length);

  console.log(`[${eco}] Current root (${root_?.src}): "${root_?.name}"`);
  if (ecoTsvEntries.length === 0) {
    console.log(`  eco_tsv: (none)`);
  } else {
    for (const [, v] of ecoTsvEntries) {
      console.log(`  eco_tsv: "${v.name}"`);
      console.log(`    moves: ${v.moves}`);
    }
  }
  console.log();
}
