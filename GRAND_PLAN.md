# eco.json Data Quality Grand Plan

## Background

Analysis conducted April 2026 identified several categories of data quality issues
across the 12,377 opening entries in eco.json. This document tracks them from
least to most impactful, with rationale, scope, and dependencies for each step.

---

## Step 1 — Fix whitespace in `eco` and `name` fields ✅ DONE

**Impact:** Trivial — no schema change, no consumer breakage  
**Risk:** None  
**Scope:** 9 entries in ecoC.json and ecoE.json

Six entries had trailing spaces in their `eco` field (`C89 `, `C90 `, `C95 `,
`C98 `, `E12 `, `E80 `), causing them to not match clean ECO code lookups. Three
additional entries had trailing spaces in their `name` field only.

**Fixed by:** `scripts/fixMissingRoots.mjs`

---

## Step 2 — Add missing `isEcoRoot` entries ✅ DONE

**Impact:** Low — additive only, no existing data changed  
**Risk:** None  
**Scope:** 3 ECO codes: A74, B85, D71

Every ECO code A01–E99 (except A00, which has no single canonical root by design)
should have exactly one entry marked `isEcoRoot: true`. Three codes were missing
this flag entirely. The shortest `eco_tsv` entry for each code was designated root.

**Note on A00:** Intentionally excluded. A00 covers a large family of irregular
openings with no single canonical root position.

**Fixed by:** `scripts/fixMissingRoots.mjs`

---

## Step 3 — Fix `isEcoRoot` on transposition cases ✅ DONE

**Impact:** Low — changes which FEN holds the `isEcoRoot` flag, no entries added
or removed  
**Risk:** Low — consumers using `positionBook` (position-only FEN fallback) are
unaffected; consumers doing exact-FEN root lookups will now get the eco_tsv FEN
instead of the SCID FEN  
**Scope:** 34 ECO codes where `isEcoRoot` was on a SCID-sourced FEN but an eco_tsv
FEN exists for the identical board position (confirmed by matching the first field
of the FEN string). 16 remaining SCID roots have no eco_tsv entry at the same
board position and are correctly left as-is.

**Per stated policy:** `eco_tsv` is the authoritative source and supersedes all
conflicts. The `isEcoRoot` flag should live on the eco_tsv FEN, not the SCID FEN.

**Affected codes:** A31, A33, A38, A55, A62, A63, A64, A69, A70, A71, A78, B61,
B79, B88, B89, C01, C76, C90, D01, D14, D37, D38, D45, D46, D52, D55, D60, D61,
D63, D77, D87, E29, E67, E77

**Fixed by:** `scripts/fixTranspositionRoots.mjs`

---

## Step 4 — Audit the 14 "different position" SCID roots ✅ DONE

**Impact:** Low-to-medium — may require moving `isEcoRoot` to a different position
entirely, or accepting SCID as correct in some cases  
**Risk:** Low-medium — needs case-by-case human review  
**Scope:** 14 ECO codes where SCID's `isEcoRoot` entry and the eco_tsv candidate
point to genuinely different board positions (not just transpositions)

**Initial affected codes:** A79, B13, B54, B56, C01, C32, C70, C77, C85, D01, D56, D89,
E00, E02

**Note:** C01 and D01 were already fixed in Step 3 (transpositions); they did not
require separate action here.

**Case-by-case verdicts:**

| Code | Verdict         | Reason                                                                                         |
| ---- | --------------- | ---------------------------------------------------------------------------------------------- |
| B13  | Move to eco_tsv | SCID root `3...cxd5` is one move too deep; eco_tsv has shallower `3.exd5`                      |
| C70  | Move to eco_tsv | SCID root `4.Ba4` (11 moves); eco_tsv has Morphy Defense `3...a6` (9 moves)                    |
| C85  | Move to eco_tsv | SCID has `6.Bxc6 dxc6` (18 moves); eco_tsv has `6.Bxc6` (17 moves, one earlier)                |
| E02  | Move to eco_tsv | SCID has `5.Qa4+` (14 moves); eco_tsv has `4...dxc4` (12 moves, shallower)                     |
| A79  | Keep SCID       | eco_tsv entry at `11.f3` reuses A78's name unchanged; SCID `11.f3 Nc7` introduces the new name |
| B54  | Keep SCID       | SCID root (11 moves) is shallower than all eco_tsv entries (12+ moves)                         |
| B56  | Keep SCID       | SCID root (14 moves) is shallower than all eco_tsv entries (15+ moves)                         |
| C32  | Keep SCID       | SCID root (12 moves) is shallower than all eco_tsv entries (14+ moves)                         |
| C77  | Keep SCID       | SCID root (12 moves) is shallower than all eco_tsv entries (14+ moves)                         |
| D56  | Keep SCID       | SCID root (20 moves) is shallower than all eco_tsv entries (21+ moves)                         |
| D72  | Keep SCID       | SCID is only source (no eco_tsv entries exist)                                                 |
| D73  | Keep SCID       | SCID is only source (no eco_tsv entries exist)                                                 |
| D89  | Keep SCID       | SCID is one move shallower (38 vs 39); legitimately different positions                        |
| E00  | Keep SCID       | SCID root (`1.d4 Nf6 2.c4 e6`, 6 moves) is intentionally broad, shallower                      |
| E57  | Keep SCID       | SCID is only source (no eco_tsv entries exist)                                                 |
| E88  | Keep SCID       | SCID is only source (no eco_tsv entries exist)                                                 |

**Fixed by:** `scripts/fixStep4Roots.mjs`

---

## Step 5 — Naming canonicalization (substitution file)

**Impact:** Medium — adds a new artifact to the repo; no schema change to ecoA–E
files; consumers opt in  
**Risk:** Low — purely additive  
**Scope:** The ~2,869 positions where the opening root name itself conflicts across
sources (e.g. "Russian Game" vs "Petroff Defence" vs "Petrov's Defense")

**Approach:**

- Create `canonicalNames.json`: a mapping of `"current name" → "canonical name"`
- Canonical name follows eco_tsv convention where available
- File is PR-reviewable and manually curated for semantic conflicts
- Mechanical conflicts (apostrophe style, umlaut normalization, `Defence` vs
  `Defense`) handled by a separate normalization pass, not the substitution file
- Users can supply their own override file downstream (fensterchess, etc.)

**Out of scope for this file:** SCID-unique entries with no competing name — they
are already unambiguous and should be left unchanged.

**Dependency:** Steps 3 and 4 should be complete first, so root names are stable
before canonicalization begins.

---

## Step 6 — Schema restructuring: canonical position + transposition list

**Impact:** High — breaking schema change to ecoA–E.json files  
**Risk:** High — all consumers (fensterchess, npm package methods, eco.json.tooling)
must be updated  
**Scope:** 268 board positions that currently have more than one FEN entry

- 261 have 2 FENs for the same board position
- 7 have 3 FENs
- 90 have conflicting ECO codes (hardest cases)
- 241 have conflicting names
- 27 have the same name (pure move-order transpositions, no naming conflict)

**Proposed new structure:**

```json
{
  "<canonical-fen>": {
    "src": "eco_tsv",
    "eco": "D60",
    "name": "Queen's Gambit Declined: Orthodox Defense",
    "moves": "1. d4 Nf6 2. c4 e6 ...",
    "isEcoRoot": true,
    "transpositions": [
      {
        "src": "scid",
        "name": "QGD: Orthodox Defence",
        "moves": "1. d4 d5 2. c4 e6 ..."
      }
    ]
  }
}
```

**Canonical FEN selection rule:**

1. Prefer eco_tsv FEN if one exists for the position
2. Otherwise prefer the FEN with fewest half-moves
3. Tie-break: source priority order (eco_tsv > eco_js > wiki_b > scid > others)

**What this solves:**

- `isEcoRoot` is unambiguous — only one FEN per board position
- All move-order paths are preserved for `fromTo.json` traversal
- Names are attached to their source move order
- `positionBook` fallback becomes unnecessary (one canonical FEN per position)

**What still needs resolution:**

- 90 different-ECO cases: which ECO code wins when sources disagree?
  Proposal: eco_tsv wins; if no eco_tsv entry, fewest-moves entry wins
- Castling rights / en passant in FEN may legitimately differ between transpositions
  even at the same board position — need to decide whether to preserve or discard
  these in the transposition list

**Dependencies:** Steps 3, 4, and 5 should be complete. Build tooling in
eco.json.tooling must be updated to generate `fromTo.json` by walking both
canonical and transposition move sequences.

---

## Summary Table

| Step | Description                                    | Schema Change | Risk    | Status  |
| ---- | ---------------------------------------------- | ------------- | ------- | ------- |
| 1    | Trim whitespace in eco/name fields             | No            | None    | ✅ Done |
| 2    | Add missing isEcoRoot (A74, B85, D71)          | No            | None    | ✅ Done |
| 3    | Fix isEcoRoot on 34 transpositions             | No            | Low     | ✅ Done |
| 4    | Audit 14 different-position SCID roots         | No            | Low-Med | Pending |
| 5    | Naming canonicalization substitution file      | Additive      | Low     | Pending |
| 6    | Schema restructure: canonical + transpositions | Breaking      | High    | Future  |
