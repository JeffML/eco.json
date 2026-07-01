#!/usr/bin/env bash
# Merges all eco JSON files into a single openings.json.gz in the repo root.
# Each file is a JSON object { fen: Opening, ... }; we strip the outer braces
# and concatenate the entries, separated by commas, wrapped in a single {}.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$REPO_ROOT/openings.json.gz"

FILES=(
  "$REPO_ROOT/ecoA.json"
  "$REPO_ROOT/ecoB.json"
  "$REPO_ROOT/ecoC.json"
  "$REPO_ROOT/ecoD.json"
  "$REPO_ROOT/ecoE.json"
  "$REPO_ROOT/eco_interpolated.json"
)

# Strip blank lines, then first and last lines (the outer { and })
strip() {
  sed '/^[[:space:]]*$/d' "$1" | sed '1d;$d'
}

{
  echo '{'
  last_idx=$(( ${#FILES[@]} - 1 ))
  for i in "${!FILES[@]}"; do
    strip "${FILES[$i]}"
    if [[ $i -lt $last_idx ]]; then
      echo ','
    fi
  done
  echo '}'
} | gzip -9 > "$OUT"

echo "Written: $OUT ($(wc -c < "$OUT") bytes)"
