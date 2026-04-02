/**
 * findOrphans.mjs
 *
 * Finds eco entries that appear as no named opening's destination in fromTo.json.
 * These are "orphans" - positions unreachable via the named opening graph.
 *
 * Note: Some positions are legitimately "roots" (e.g. the starting position or
 * very first moves) and won't appear as destinations - those are expected.
 * We flag entries that have many moves (depth > 2) as true orphans worth reviewing.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ECO_FILES = ['ecoA.json', 'ecoB.json', 'ecoC.json', 'ecoD.json', 'ecoE.json'];

const all = {};
for (const f of ECO_FILES) {
  Object.assign(all, JSON.parse(readFileSync(join(root, f), 'utf8')));
}

const fromTo = JSON.parse(readFileSync(join(root, 'fromTo.json'), 'utf8'));
const interpolated = JSON.parse(readFileSync(join(root, 'eco_interpolated.json'), 'utf8'));

// Build set of all FENs that appear as a destination in fromTo.json
const destinations = new Set(fromTo.map(([, to]) => to));

// Build set of all FENs in interpolated (these were created specifically to bridge orphans)
const interpolatedFens = new Set(Object.keys(interpolated));

const allFens = new Set(Object.keys(all));

// Find FENs in the named eco files that are NOT destinations and NOT in interpolated
const orphans = [];
const shallowRoots = []; // <= 2 half-moves, expected to have no from

for (const [fen, entry] of Object.entries(all)) {
  if (destinations.has(fen)) continue; // reachable

  const halfMoves = entry.moves.trim().split(/\s+/).filter(t => !/^\d+\./.test(t)).length;

  if (halfMoves <= 2) {
    shallowRoots.push({ fen, halfMoves, eco: entry.eco, name: entry.name, src: entry.src });
  } else {
    orphans.push({ fen, halfMoves, eco: entry.eco, name: entry.name, src: entry.src, isEcoRoot: !!entry.isEcoRoot });
  }
}

orphans.sort((a, b) => a.eco.localeCompare(b.eco));

console.log(`Total named eco entries: ${Object.keys(all).length}`);
console.log(`Destinations in fromTo.json: ${destinations.size}`);
console.log(`Shallow roots (<=2 half-moves, expected): ${shallowRoots.length}`);
console.log(`\nOrphans (depth > 2 half-moves, not reachable): ${orphans.length}`);

if (orphans.length > 0) {
  console.log('\n--- Orphan list ---');
  for (const o of orphans) {
    console.log(`[${o.eco}] (${o.src})${o.isEcoRoot ? ' [ROOT]' : ''} "${o.name}"`);
    console.log(`  half-moves: ${o.halfMoves}`);
  }
} else {
  console.log('None — all entries are reachable via fromTo.json.');
}
