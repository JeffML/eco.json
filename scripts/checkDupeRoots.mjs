import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('/home/jlowery2663/eco.json/ecoA.json', 'utf8'));
const t1 = 'rnbqkbnr/pp2pppp/2p5/3p4/4P3/2N4P/PPPP1PP1/R1BQKBNR b KQkq - 0 3';
const t2 = 'rnbqkb1r/ppp1pp1p/5np1/3p4/3P1B2/2N2N2/PPP1PPPP/R2QKB1R b KQkq - 1 4';
console.log('A00 St. Patrick isEcoRoot:', !!data[t1]?.isEcoRoot);
console.log('A48 Barry Attack isEcoRoot:', !!data[t2]?.isEcoRoot);
