import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const files = ["ecoA.json", "ecoB.json", "ecoC.json", "ecoD.json", "ecoE.json"];
for (const f of files) {
  const data = JSON.parse(readFileSync(join(root, f)));
  const bad = Object.entries(data).filter(([, v]) => v.eco !== v.eco.trim());
  if (bad.length) {
    console.log(`\n${f}: ${bad.length} entries with whitespace in eco field`);
    bad.forEach(([fen, v]) => console.log(`  eco:|${v.eco}| name:"${v.name}"`));
  }
}
