import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load all eco files
const files = ["ecoA.json", "ecoB.json", "ecoC.json", "ecoD.json", "ecoE.json"];
let all = {};
for (const f of files) {
  Object.assign(all, JSON.parse(readFileSync(join(root, f))));
}

const entries = Object.entries(all);
const total = entries.length;

// ─── 1. Source distribution ───────────────────────────────────────────────
const srcCounts = {};
for (const [, v] of entries) {
  srcCounts[v.src] = (srcCounts[v.src] || 0) + 1;
}
console.log("\n=== 1. Primary source distribution ===");
Object.entries(srcCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, n]) => {
    console.log(
      `  ${s.padEnd(14)} ${n.toString().padStart(5)}  (${((100 * n) / total).toFixed(1)}%)`,
    );
  });
console.log(`  ${"TOTAL".padEnd(14)} ${total.toString().padStart(5)}`);

// ─── 2. Alias presence ────────────────────────────────────────────────────
const withAliases = entries.filter(
  ([, v]) => v.aliases && Object.keys(v.aliases).length > 0,
);
const noAliases = entries.filter(
  ([, v]) => !v.aliases || Object.keys(v.aliases).length === 0,
);
console.log("\n=== 2. Alias presence ===");
console.log(
  `  Has aliases:  ${withAliases.length} (${((100 * withAliases.length) / total).toFixed(1)}%)`,
);
console.log(
  `  No aliases:   ${noAliases.length} (${((100 * noAliases.length) / total).toFixed(1)}%)`,
);

// ─── 3. Alias source usage ────────────────────────────────────────────────
const aliasSrcCounts = {};
for (const [, v] of withAliases) {
  for (const src of Object.keys(v.aliases)) {
    aliasSrcCounts[src] = (aliasSrcCounts[src] || 0) + 1;
  }
}
console.log(
  "\n=== 3. Alias source usage (how many positions each source aliases) ===",
);
Object.entries(aliasSrcCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, n]) => {
    console.log(`  ${s.padEnd(14)} ${n.toString().padStart(5)}`);
  });

// ─── 4. Name conflicts (same position, different name across sources) ──────
// A "conflict" = canonical name differs from ≥1 alias name (ignoring punctuation/case)
const normalize = (s) =>
  s.toLowerCase().replace(/[''`]/g, "'").replace(/\s+/g, " ").trim();

const conflicts = withAliases.filter(([, v]) => {
  const canon = normalize(v.name);
  return Object.values(v.aliases).some((a) => normalize(a) !== canon);
});
console.log(
  "\n=== 4. Name conflicts (position has at least one alias differing from canonical) ===",
);
console.log(
  `  ${conflicts.length} of ${withAliases.length} aliased positions have name conflicts`,
);

// ─── 5. SCID aliases specifically ─────────────────────────────────────────
const scidAliasConflicts = withAliases.filter(
  ([, v]) => v.aliases?.scid && normalize(v.aliases.scid) !== normalize(v.name),
);
console.log("\n=== 5. SCID name conflicts ===");
console.log(
  `  ${scidAliasConflicts.length} positions have a SCID alias that differs from canonical name`,
);

// ─── 6. Entries where src=scid (SCID is the primary source) ───────────────
const scidPrimary = entries.filter(([, v]) => v.src === "scid");
console.log("\n=== 6. SCID-primary entries (src=scid — unique to SCID) ===");
console.log(`  ${scidPrimary.length} entries`);
if (scidPrimary.length > 0) {
  console.log("  Sample:");
  scidPrimary.slice(0, 5).forEach(([fen, v]) => {
    console.log(`    [${v.eco}] "${v.name}" | scid:${v.scid || "n/a"}`);
  });
}

// ─── 7. Name structure analysis (opening: variation, subvariation) ────────
// Standard pattern: "Opening Name: Variation Name, Subvariation Name"
const namePattern = /^([^:]+?)(?::\s*(.+?))?(?:,\s*(.+))?$/;
let opening_only = 0,
  opening_variation = 0,
  opening_variation_sub = 0,
  other = 0;
for (const [, v] of entries) {
  const parts = v.name.split(":");
  const sub = parts.length > 1 ? parts[1].split(",") : [];
  if (parts.length === 1) opening_only++;
  else if (sub.length === 1) opening_variation++;
  else if (sub.length >= 2) opening_variation_sub++;
  else other++;
}
console.log(
  "\n=== 7. Name structure (opening / opening:variation / opening:variation,sub) ===",
);
console.log(`  Opening only:         ${opening_only.toString().padStart(5)}`);
console.log(
  `  Opening: Variation:   ${opening_variation.toString().padStart(5)}`,
);
console.log(
  `  Opening: Var, SubVar: ${opening_variation_sub.toString().padStart(5)}`,
);

// ─── 8. Top conflicting opening roots (most aliases disagreeing with canon)
const rootConflictCounts = {};
for (const [, v] of conflicts) {
  const root = v.name.split(":")[0].trim();
  rootConflictCounts[root] = (rootConflictCounts[root] || 0) + 1;
}
const topRoots = Object.entries(rootConflictCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);
console.log("\n=== 8. Opening roots with most naming conflicts ===");
topRoots.forEach(([name, n]) => {
  console.log(`  ${n.toString().padStart(4)}  ${name}`);
});

// ─── 9. Sample of actual conflicts (canonical vs SCID vs others) ──────────
console.log("\n=== 9. Sample name conflicts (canonical vs aliases) ===");
// Pick interesting ones: where ALL alias sources disagree or root name totally differs
const dramatic = conflicts.filter(([, v]) => {
  const canon = normalize(v.name).split(":")[0].trim();
  return Object.values(v.aliases).some((a) => {
    const aliasRoot = normalize(a).split(":")[0].trim();
    return (
      aliasRoot !== canon &&
      !aliasRoot.includes(canon) &&
      !canon.includes(aliasRoot)
    );
  });
});
console.log(
  `  ${dramatic.length} positions where the opening root name itself conflicts`,
);
dramatic.slice(0, 15).forEach(([fen, v]) => {
  console.log(`  [${v.eco}] canonical: "${v.name}"`);
  Object.entries(v.aliases).forEach(([src, aname]) => {
    if (normalize(aname) !== normalize(v.name)) {
      console.log(`         ${src.padEnd(12)}: "${aname}"`);
    }
  });
});

// ─── 10. Positions where eco_js aliases differ from eco_tsv canonical ──────
const ecoJsConflicts = withAliases.filter(
  ([, v]) =>
    v.aliases?.eco_js && normalize(v.aliases.eco_js) !== normalize(v.name),
);
console.log("\n=== 10. eco_js vs eco_tsv canonical name conflicts ===");
console.log(`  ${ecoJsConflicts.length} positions`);
ecoJsConflicts.slice(0, 5).forEach(([, v]) => {
  console.log(
    `  [${v.eco}] eco_tsv: "${v.name}" | eco_js: "${v.aliases.eco_js}"`,
  );
});
