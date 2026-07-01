# Plan: Compress eco.json Opening Data, Decompress on chessPGN and fensterchess Clients

## TL;DR
Generate a single gzip-compressed `openings.json.gz` (~468KB vs 5MB raw) by merging all eco category files. Commit it to the eco.json repo root so it's accessible via GitHub raw URL. Update `openingBook()` in the eco.json npm package to fetch and decompress this single file using `DecompressionStream` (universally available in Node 18+ and modern browsers). fensterchess just needs a package version bump. chessPGN gets a new `annotateOpenings()` standalone function as an optional eco.json integration.

## Key Facts
- Raw: 5,072,277 bytes (6 files)
- Gzip -9: 468,298 bytes → 9:1 compression
- DecompressionStream: available in all modern browsers + Node 18+ (chessPGN requires Node 22+)
- fensterchess uses `openingBook()` from `@chess-openings/eco.json` v1.1.0 via OpeningBookContext
- chessPGN has no eco.json integration today; pgn-annotate/src/openings.js is the reference implementation
- IChessGame has fen(), undo(), load() — satisfies ChessGameLike for lookupByMoves()

---

## Phase 1 — eco.json: Generate and commit openings.json.gz

**Step 1** — Add `scripts/buildOpeningsGz.mjs` to the eco.json repo
- Reads ecoA-E.json + eco_interpolated.json
- Merges all into a single flat `{ [fen]: Opening }` object (same shape as OpeningCollection)
- Gzip-compresses with `zlib.createGzip()` (Node built-in)
- Writes `openings.json.gz` to repo root
- Add `"build:gz": "node scripts/buildOpeningsGz.mjs"` to package.json scripts

**Step 2** — Commit `openings.json.gz` to repo root
- Accessible at `https://raw.githubusercontent.com/JeffML/eco.json/master/openings.json.gz`
- Add to `.gitattributes` as binary if needed

---

## Phase 2 — eco.json npm package: Update openingBook() to use gz

**Step 3** — Update `methods/getLatestEcoJson.ts`
- Add module-level `mergedCache: OpeningCollection | null = null`
- Update `openingBook()` to:
  1. Return `mergedCache` if already loaded
  2. Fetch `openings.json.gz` from GitHub raw URL
  3. Decompress via `DecompressionStream('gzip')` using Web Streams API:
     `response.body.pipeThrough(new DecompressionStream('gzip'))`
  4. Parse JSON, set `mergedCache`, return
- Leave `getLatestEcoJson()` unchanged — backward compat for per-category access

**Step 4** — Bump version to 2.2.0 in package.json, run `npm run build`, publish
- `openingBook()` callers get fast path automatically
- `getLatestEcoJson()` callers unaffected

---

## Phase 3 — fensterchess: Version bump only

**Step 5** — Update `@chess-openings/eco.json` from `^1.1.0` to `^2.2.0` in fensterchess `package.json`
- `OpeningBookContext.tsx` calls `openingBook()` — no code changes needed
- Run `npm install` to pull updated package

*Depends on Step 4.*

---

## Phase 4 — chessPGN: Add optional opening annotation

**Step 6** — Add `src/openings.ts` to chessPGN
- Standalone async function `annotateOpenings(game: IChessGame, opts?: AnnotateOpeningsOptions): Promise<void>`
- Dynamically imports `@chess-openings/eco.json` — throws descriptive error if not installed
- Uses `lookupByMoves(game, openingBook)` — IChessGame satisfies ChessGameLike (has fen/undo/load)
- Ports logic from `pgn-annotate/src/openings.js`:
  - Walk moves to find deepest named opening position
  - Set ECO/Opening/Variation headers (replace or additive mode)
  - Add boundary comment at last in-book move
  - Add $146 novelty NAG on first out-of-book move (optional)
- Options type `AnnotateOpeningsOptions` added to `src/types.ts`

**Step 7** — Declare optional peer dependency in chessPGN `package.json`
```json
"peerDependencies": { "@chess-openings/eco.json": ">=2.2.0" },
"peerDependenciesMeta": { "@chess-openings/eco.json": { "optional": true } }
```

**Step 8** — Export `annotateOpenings` from chessPGN public API
- Add export to `src/chessPGN.ts` entry point
- Run `npm run api:update` to record new API surface

*Steps 6-8 parallel with Phase 3. Depends on Phase 2 being published.*

---

## Relevant Files

**eco.json repo:**
- `scripts/buildOpeningsGz.mjs` — new script (generate the gz)
- `openings.json.gz` — new generated artifact committed to repo root
- `methods/getLatestEcoJson.ts` — update `openingBook()` fast path
- `package.json` — add build:gz script, bump version to 2.2.0

**fensterchess:**
- `package.json` — update `@chess-openings/eco.json` version

**chessPGN:**
- `src/openings.ts` — new file with `annotateOpenings()`
- `src/types.ts` — add `AnnotateOpeningsOptions` type
- `src/chessPGN.ts` — export `annotateOpenings`
- `package.json` — add optional peer dependency

---

## Verification

1. `node scripts/buildOpeningsGz.mjs` — verify openings.json.gz is created at ~468KB
2. Smoke test decompression in Node: fetch the gz URL, decompress, verify key count matches raw data (~12K entries)
3. Smoke test in browser (fensterchess dev): `openingBook()` resolves correctly; opening lookup works
4. fensterchess: run `npm test` and check OpeningBookContext loads without errors in dev
5. chessPGN: `annotateOpenings(game)` on a loaded game sets ECO/Opening headers correctly
6. chessPGN: calling `annotateOpenings` without eco.json installed throws descriptive error
7. chessPGN: `npm run api:check` confirms API surface is correct; `npm run check` passes

---

## Decisions
- `openingBook()` updated in-place (not a new function) — all callers get the improvement automatically
- `getLatestEcoJson()` left unchanged — backward compat for per-category consumers
- DecompressionStream chosen over zlib/environment detection — universal, no deps, Node 22+ guaranteed
- gz committed to repo root — same pattern as other generated artifacts (fromToPositionIndexed.json)
- chessPGN annotation is a standalone function, NOT added to IChessGame interface — keeps the core interface clean, avoids a breaking API change, and opening annotation is an optional utility

## Scope Exclusions
- No changes to how `getLatestEcoJson()` loads data (per-category path untouched)
- No changes to `fromToPositionIndexed.json` or scores.json loading
- chessPGN `annotateOpenings` does not add eval/NAG support (that was pgn-annotate scope; deferred)
