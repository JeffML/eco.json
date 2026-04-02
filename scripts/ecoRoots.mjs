import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const files = ["ecoA.json", "ecoB.json", "ecoC.json", "ecoD.json", "ecoE.json"];
let all = {};
for (const f of files)
  Object.assign(all, JSON.parse(readFileSync(join(root, f))));

const rootEcos = new Set(
  Object.values(all)
    .filter((v) => v.isEcoRoot)
    .map((v) => v.eco),
);
const allEcos = [...new Set(Object.values(all).map((v) => v.eco))].sort();
const missing = allEcos.filter((e) => !rootEcos.has(e));
console.log("ECO codes with no isEcoRoot:", missing.length);
console.log(missing.join(" "));

const scidRoots = Object.values(all)
  .filter((v) => v.isEcoRoot && v.src === "scid")
  .map((v) => ({ eco: v.eco, name: v.name }))
  .sort((a, b) => a.eco.localeCompare(b.eco));
console.log("\nSCID-sourced roots:", scidRoots.length);
scidRoots.forEach((r) => console.log(r.eco, r.name));
