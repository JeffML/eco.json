/**
 * validate.mjs
 *
 * Pre-publish validation for eco.json data files.
 * Checks:
 *   1. Structural integrity — one isEcoRoot per ECO code, no duplicates, no
 *      FEN collisions across files, no bad eco field values
 *   2. Regression — no whitespace in eco/name fields
 *   3. fromTo graph — all FENs in fromTo.json exist in eco files
 *   4. npm package — type-check passes and package builds cleanly
 *
 * Exits with code 1 if any check fails.
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";
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

let failures = 0;

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failures++;
}
function section(title) {
  console.log(`\n── ${title}`);
}

// ─── Load data ───────────────────────────────────────────────────────────────

const fileEntries = {};
for (const f of ECO_FILES) {
  fileEntries[f] = JSON.parse(readFileSync(join(root, f), "utf8"));
}

// Merged view: track which file each FEN came from
const all = {};
const fenToFile = {};
for (const [file, entries] of Object.entries(fileEntries)) {
  for (const [fen, entry] of Object.entries(entries)) {
    all[fen] = entry;
    fenToFile[fen] = file;
  }
}

const fromTo = JSON.parse(readFileSync(join(root, "fromTo.json"), "utf8"));
const interpolated = JSON.parse(
  readFileSync(join(root, "eco_interpolated.json"), "utf8"),
);

// ─── Check 1: No FEN collisions across files ─────────────────────────────────
section("Check 1: No FEN collisions across eco files");
{
  const seen = {};
  let collisions = 0;
  for (const [file, entries] of Object.entries(fileEntries)) {
    for (const fen of Object.keys(entries)) {
      if (seen[fen]) {
        fail(
          `FEN appears in both ${seen[fen]} and ${file}: ${fen.slice(0, 60)}...`,
        );
        collisions++;
      } else {
        seen[fen] = file;
      }
    }
  }
  if (collisions === 0)
    pass(`No FEN collisions across ${ECO_FILES.length} files`);
}

// ─── Check 2: Valid ECO codes ─────────────────────────────────────────────────
section("Check 2: All eco field values are valid (A00–E99)");
{
  const validEco = /^[A-E][0-9]{2}$/;
  let bad = 0;
  for (const [fen, entry] of Object.entries(all)) {
    if (!entry.eco || !validEco.test(entry.eco)) {
      fail(`Invalid eco "${entry.eco}" at ${fen.slice(0, 50)}`);
      bad++;
    }
  }
  if (bad === 0)
    pass(`All ${Object.keys(all).length} entries have valid ECO codes`);
}

// ─── Check 3: Exactly one isEcoRoot per ECO code (A01–E99, excluding A00) ────
section("Check 3: Exactly one isEcoRoot per ECO code (A01–E99)");
{
  const rootsByCode = {};
  for (const [fen, entry] of Object.entries(all)) {
    if (entry.isEcoRoot) {
      if (!rootsByCode[entry.eco]) rootsByCode[entry.eco] = [];
      rootsByCode[entry.eco].push({ fen, name: entry.name, src: entry.src });
    }
  }

  // Check for duplicates
  let dupes = 0;
  for (const [eco, roots] of Object.entries(rootsByCode)) {
    if (roots.length > 1) {
      fail(`ECO ${eco} has ${roots.length} isEcoRoot entries:`);
      roots.forEach((r) => console.error(`    (${r.src}) "${r.name}"`));
      dupes++;
    }
  }
  if (dupes === 0) pass("No ECO code has more than one isEcoRoot");

  // Check for missing roots (A01–E99)
  const missing = [];
  for (const cat of "ABCDE") {
    const start = cat === "A" ? 1 : 0; // A00 is intentionally excluded
    for (let n = start; n <= 99; n++) {
      const code = `${cat}${String(n).padStart(2, "0")}`;
      if (!rootsByCode[code]) missing.push(code);
    }
  }

  // Some codes may legitimately not exist in the data at all
  const codesInData = new Set(Object.values(all).map((e) => e.eco));
  const trulyMissing = missing.filter((code) => codesInData.has(code));

  if (trulyMissing.length === 0) {
    pass("Every ECO code present in data has an isEcoRoot entry");
  } else {
    fail(
      `ECO codes present in data but missing isEcoRoot: ${trulyMissing.join(", ")}`,
    );
  }

  pass(`${Object.keys(rootsByCode).length} ECO codes have exactly one root`);
}

// ─── Check 4: No whitespace in eco or name fields ─────────────────────────────
section("Check 4: No trailing/leading whitespace in eco or name fields");
{
  let ws = 0;
  for (const [fen, entry] of Object.entries(all)) {
    if (entry.eco !== entry.eco.trim()) {
      fail(`Whitespace in eco field "${entry.eco}" (${fenToFile[fen]})`);
      ws++;
    }
    if (entry.name && entry.name !== entry.name.trim()) {
      fail(`Whitespace in name field "${entry.name}" (${fenToFile[fen]})`);
      ws++;
    }
  }
  if (ws === 0) pass("No whitespace issues in eco or name fields");
}

// ─── Check 5: All fromTo FENs exist in eco files ─────────────────────────────
section("Check 5: All FENs referenced in fromTo.json exist in eco files");
{
  const allFens = new Set([...Object.keys(all), ...Object.keys(interpolated)]);
  let missing = 0;
  for (const [from, to] of fromTo) {
    if (!allFens.has(from)) {
      fail(`fromTo 'from' FEN not in any eco file: ${from.slice(0, 60)}`);
      missing++;
    }
    if (!allFens.has(to)) {
      fail(`fromTo 'to' FEN not in any eco file: ${to.slice(0, 60)}`);
      missing++;
    }
  }
  if (missing === 0)
    pass(`All ${fromTo.length} fromTo transitions reference valid FENs`);
}

// ─── Check 6: npm type-check and build ───────────────────────────────────────
section("Check 6: npm type-check and build");
{
  try {
    execSync("npm run type-check", { cwd: root, stdio: "pipe" });
    pass("TypeScript type-check passed");
  } catch (e) {
    fail("TypeScript type-check failed:\n" + e.stderr?.toString());
  }

  try {
    execSync("npm run build", { cwd: root, stdio: "pipe" });
    pass("npm build passed");
  } catch (e) {
    fail("npm build failed:\n" + e.stderr?.toString());
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(50));
if (failures === 0) {
  console.log(`✓ All checks passed. Ready to publish.`);
  process.exit(0);
} else {
  console.error(`✗ ${failures} failure(s). Fix before publishing.`);
  process.exit(1);
}
