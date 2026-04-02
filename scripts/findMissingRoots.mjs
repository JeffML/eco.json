import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const files = ["ecoA.json", "ecoB.json", "ecoC.json", "ecoD.json", "ecoE.json"];
let all = {};
const fileMap = {}; // fen -> filename
for (const f of files) {
  const data = JSON.parse(readFileSync(join(root, f)));
  for (const fen of Object.keys(data)) fileMap[fen] = f;
  Object.assign(all, data);
}

const missing = ["A74", "B85", "C89", "C90", "C95", "C98", "D71", "E12", "E80"];

for (const eco of missing) {
  const entries = Object.entries(all).filter(([, v]) => v.eco === eco);
  console.log(`\n=== ${eco} (${entries.length} entries) ===`);
  // Sort by move length (fewest moves = closest to root)
  entries
    .sort((a, b) => a[1].moves.length - b[1].moves.length)
    .slice(0, 6)
    .forEach(([fen, v]) => {
      const flag = v.isEcoRoot ? " [ROOT]" : "";
      console.log(`  [${v.src}]${flag} "${v.name}"`);
      console.log(`    moves: ${v.moves}`);
      console.log(`    file:  ${fileMap[fen]}`);
      if (v.aliases) console.log(`    aliases: ${JSON.stringify(v.aliases)}`);
    });
}
