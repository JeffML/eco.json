/**
 * fixStep4Roots.mjs
 *
 * Step 4 of Grand Plan: Fix 4 SCID-sourced isEcoRoot entries where a shallower
 * eco_tsv entry exists at a genuinely different (not transposed) position.
 *
 * Verdicts from auditStep4.mjs:
 *   B13 - move to eco_tsv (SCID root 1 move too deep)
 *   C70 - move to eco_tsv (eco_tsv Morphy Defense is shallower)
 *   C85 - move to eco_tsv (eco_tsv is 1 move shallower)
 *   E02 - move to eco_tsv (eco_tsv is 2 moves shallower)
 *
 * For each, we pick the shallowest eco_tsv entry as the new root.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ECO_FILES = ['ecoA.json', 'ecoB.json', 'ecoC.json', 'ecoD.json', 'ecoE.json'];

// Load all data, tracking which file each FEN came from
const fileData = {};
for (const f of ECO_FILES) {
  fileData[f] = JSON.parse(readFileSync(join(root, f), 'utf8'));
}

const FIX_CODES = ['B13', 'C70', 'C85', 'E02'];

let totalMoved = 0;

for (const ecoCode of FIX_CODES) {
  // Find the current SCID root
  let scidRootFen = null;
  let scidRootFile = null;
  let ecoTsvCandidates = [];

  for (const [file, entries] of Object.entries(fileData)) {
    for (const [fen, entry] of Object.entries(entries)) {
      if (entry.eco !== ecoCode) continue;
      if (entry.isEcoRoot && entry.src === 'scid') {
        scidRootFen = fen;
        scidRootFile = file;
      }
      if (entry.src === 'eco_tsv') {
        ecoTsvCandidates.push({ fen, entry, file, moveLen: entry.moves.trim().split(/\s+/).length });
      }
    }
  }

  if (!scidRootFen) {
    console.log(`[${ecoCode}] No SCID root found — skipping`);
    continue;
  }

  if (ecoTsvCandidates.length === 0) {
    console.log(`[${ecoCode}] No eco_tsv entries — skipping`);
    continue;
  }

  // Pick the shallowest eco_tsv entry (fewest moves)
  ecoTsvCandidates.sort((a, b) => a.moveLen - b.moveLen);
  const best = ecoTsvCandidates[0];

  console.log(`[${ecoCode}] Removing isEcoRoot from SCID: "${fileData[scidRootFile][scidRootFen].name}"`);
  console.log(`         moves: ${fileData[scidRootFile][scidRootFen].moves}`);
  console.log(`[${ecoCode}] Adding isEcoRoot to eco_tsv: "${best.entry.name}"`);
  console.log(`         moves: ${best.entry.moves}`);

  // Apply changes
  delete fileData[scidRootFile][scidRootFen].isEcoRoot;
  fileData[best.file][best.fen].isEcoRoot = true;

  totalMoved++;
  console.log();
}

// Write back changed files
for (const [file, entries] of Object.entries(fileData)) {
  writeFileSync(join(root, file), JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

console.log(`Done. Moved isEcoRoot for ${totalMoved} ECO codes.`);
