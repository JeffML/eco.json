/**
 * Step 4: Detailed report on the 14 remaining SCID isEcoRoot entries
 * that point to genuinely different board positions than the eco_tsv candidate.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const files = ['ecoA.json','ecoB.json','ecoC.json','ecoD.json','ecoE.json'];
let all = {};
for (const f of files) Object.assign(all, JSON.parse(readFileSync(join(root, f))));

const pos = fen => fen.split(' ')[0];
const moveCount = moves => moves.trim().split(/\s+/).length;

const scidRoots = Object.entries(all).filter(([, v]) => v.isEcoRoot && v.src === 'scid');

for (const [scidFen, scidV] of scidRoots) {
  const scidPos = pos(scidFen);

  // These are cases where no eco_tsv entry shares the same board position
  // Find the shortest eco_tsv entry for the same ECO code (the best candidate)
  const tsvForCode = Object.entries(all)
    .filter(([, v]) => v.src === 'eco_tsv' && v.eco === scidV.eco)
    .sort((a, b) => moveCount(a[1].moves) - moveCount(b[1].moves));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`ECO ${scidV.eco}`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`CURRENT ROOT (scid, isEcoRoot=true):`);
  console.log(`  name:  "${scidV.name}"`);
  console.log(`  moves: ${scidV.moves}`);
  console.log(`  moves#: ${moveCount(scidV.moves)}`);
  console.log(`  fen:   ${scidFen}`);

  if (tsvForCode.length === 0) {
    console.log(`\neco_tsv entries for ${scidV.eco}: NONE — SCID is the only source`);
  } else {
    console.log(`\neco_tsv entries for ${scidV.eco}: ${tsvForCode.length} total`);
    console.log(`Shortest eco_tsv entry:`);
    const [tsvFen, tsvV] = tsvForCode[0];
    console.log(`  name:  "${tsvV.name}"`);
    console.log(`  moves: ${tsvV.moves}`);
    console.log(`  moves#: ${moveCount(tsvV.moves)}`);
    console.log(`  fen:   ${tsvFen}`);
    console.log(`  pos match: ${pos(tsvFen) === scidPos ? 'YES (transposition)' : 'NO (different position)'}`);

    // Show all eco_tsv entries for context
    if (tsvForCode.length > 1) {
      console.log(`\nAll eco_tsv entries for ${scidV.eco}:`);
      tsvForCode.forEach(([, v]) => {
        console.log(`  [${moveCount(v.moves)} moves] "${v.name}"`);
      });
    }
  }

  // Also show other non-eco_tsv non-scid entries for this code
  const others = Object.entries(all).filter(([, v]) =>
    v.eco === scidV.eco && v.src !== 'eco_tsv' && v.src !== 'scid'
  );
  if (others.length) {
    console.log(`\nOther sources for ${scidV.eco}:`);
    others.slice(0, 3).forEach(([, v]) => console.log(`  [${v.src}] "${v.name}"`));
  }
}
