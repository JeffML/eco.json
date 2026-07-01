import { OpeningCollection } from "../src/types.js";

/**
 * GitHub raw content URL for eco.json repository
 */
const ECO_JSON_RAW = "https://raw.githubusercontent.com/JeffML/eco.json/master/";

const OPENINGS_GZ_URL = ECO_JSON_RAW + "openings.json.gz";

let mergedCache: OpeningCollection | null = null;

interface EcoCategoryData {
  url: string;
  json?: OpeningCollection;
}

interface OpeningsByCat {
  initialized: boolean;
  A?: EcoCategoryData;
  B?: EcoCategoryData;
  C?: EcoCategoryData;
  D?: EcoCategoryData;
  E?: EcoCategoryData;
  IN?: EcoCategoryData;
}

let openingsByCat: OpeningsByCat = { initialized: false };

/**
 * Downloads and caches opening data from the eco.json GitHub repository.
 * Data is fetched once and cached for subsequent calls.
 *
 * @returns Promise resolving to opening data organized by ECO category
 *
 * @example
 * ```typescript
 * const { A, B, C, D, E, IN } = await getLatestEcoJson();
 * console.log(A?.json); // ecoA.json data
 * console.log(IN?.json); // eco_interpolated.json data
 * ```
 */
export async function getLatestEcoJson(): Promise<OpeningsByCat> {
  if (!openingsByCat.initialized) {
    openingsByCat = {
      initialized: false,
      A: { url: ECO_JSON_RAW + "ecoA.json" },
      B: { url: ECO_JSON_RAW + "ecoB.json" },
      C: { url: ECO_JSON_RAW + "ecoC.json" },
      D: { url: ECO_JSON_RAW + "ecoD.json" },
      E: { url: ECO_JSON_RAW + "ecoE.json" },
      IN: { url: ECO_JSON_RAW + "eco_interpolated.json" },
    };

    const promises: Promise<Response>[] = [];
    for (const cat in openingsByCat) {
      if (cat !== "initialized") {
        const category = openingsByCat[cat as keyof Omit<OpeningsByCat, "initialized">];
        if (category) {
          promises.push(fetch(category.url));
        }
      }
    }

    const res = await Promise.all(promises);
    let i = 0;

    for (const cat in openingsByCat) {
      if (cat !== "initialized") {
        const category = openingsByCat[cat as keyof Omit<OpeningsByCat, "initialized">];
        if (category) {
          const json = await res[i++].json();
          category.json = json;
        }
      }
    }

    openingsByCat.initialized = true;
  }

  return openingsByCat;
}

/**
 * Downloads and merges all opening data (ecoA-E + interpolated) into a single collection.
 * Fetches a single gzip-compressed file (~468KB) and caches the result after the first call.
 *
 * @returns Promise resolving to a complete opening collection keyed by FEN
 *
 * @example
 * ```typescript
 * const openings = await openingBook();
 * const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3";
 * console.log(openings[fen]); // Opening data for this position
 * ```
 */
export async function openingBook(): Promise<OpeningCollection> {
  if (mergedCache) return mergedCache;

  const response = await fetch(OPENINGS_GZ_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch openings.json.gz: ${response.status} ${response.statusText}`);
  }

  const decompressed = response.body!.pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(decompressed).text();
  mergedCache = JSON.parse(text) as OpeningCollection;

  return mergedCache;
}
