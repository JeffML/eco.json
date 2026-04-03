import type { SplitOpeningName } from "../src/types.js";

/**
 * Splits an eco.json opening name into its component PGN header fields.
 *
 * The naming convention used throughout eco.json is:
 * `"Opening: Variation, SubVariation"` where SubVariation may itself contain
 * commas (e.g. `"Reti: KIA, Yugoslav, Main Line"`). In that case all content
 * after the first comma is kept together as the subVariation string.
 *
 * @param name - An opening name from eco.json (e.g. from an {@link Opening} object)
 * @returns A {@link SplitOpeningName} with `opening`, and optionally `variation` and `subVariation`
 *
 * @example
 * ```typescript
 * splitOpeningName("Sicilian Defense")
 * // → { opening: "Sicilian Defense" }
 *
 * splitOpeningName("French: Tarrasch")
 * // → { opening: "French", variation: "Tarrasch" }
 *
 * splitOpeningName("Ruy Lopez: Closed, Anti-Marshall")
 * // → { opening: "Ruy Lopez", variation: "Closed", subVariation: "Anti-Marshall" }
 *
 * splitOpeningName("Reti: KIA, Yugoslav, Main Line, 6.Nbd2")
 * // → { opening: "Reti", variation: "KIA", subVariation: "Yugoslav, Main Line, 6.Nbd2" }
 * ```
 */
export function splitOpeningName(name: string): SplitOpeningName {
  const colonIdx = name.indexOf(":");
  if (colonIdx === -1) {
    return { opening: name.trim() };
  }

  const opening = name.slice(0, colonIdx).trim();
  const rest = name.slice(colonIdx + 1).trim();

  const commaIdx = rest.indexOf(",");
  if (commaIdx === -1) {
    return { opening, variation: rest };
  }

  const variation = rest.slice(0, commaIdx).trim();
  const subVariation = rest.slice(commaIdx + 1).trim();
  return { opening, variation, subVariation };
}
