/**
 * Source of the opening data.
 * eco_tsv is the authoritative source from lichess.
 * eco_wikip = Wikipedia chess openings pages
 * eco_wikip.g = Wikipedia "List of chess gambits" page (wikiGambits parser)
 * wiki_b = Wikibooks Chess Opening Theory (wikiChessOpeningTheoryCrawler)
 * fics = Free Internet Chess Server opening database (parser unknown/missing)
 */
export type OpeningSource =
  | "eco_tsv"
  | "eco_js"
  | "scid"
  | "eco_wikip"
  | "eco_wikip.g"
  | "wiki_b"
  | "fics"
  | "ct"
  | "chessGraph"
  | "chronos"
  | "icsbot"
  | "pgn"
  | "interpolated";

/**
 * ECO category (A-E)
 */
export type EcoCategory = "A" | "B" | "C" | "D" | "E";

/**
 * Opening variation record keyed by FEN position
 */
export interface Opening {
  /** Source of this opening data */
  src: OpeningSource;

  /** ECO code (e.g., "B03"). Not unique - many openings share the same ECO code */
  eco: string;

  /** Standard algebraic notation move sequence (e.g., "1. e4 Nf6 2. e5") */
  moves: string;

  /** Common English name of the opening */
  name: string;

  /** Alternative names from other sources, keyed by OpeningSource */
  aliases?: Partial<Record<OpeningSource, string>>;

  /** Extended SCID code when applicable */
  scid?: string;

  /** True if this is the official ECO root variation for this code */
  isEcoRoot?: boolean;

  /** For interpolated openings: the original source of the root variation */
  rootSrc?: OpeningSource;
}

/**
 * Collection of openings keyed by FEN notation
 * FEN is the unique identifier for each position
 */
export interface OpeningCollection {
  [fen: string]: Opening;
}

/**
 * Opening transition in the fromTo graph
 * [from_fen, to_fen, from_source, to_source]
 */
export type OpeningTransition = [string, string, OpeningSource, OpeningSource];

/**
 * Result of splitting an opening name into its PGN header fields.
 * Mirrors the ECO naming convention: "Opening: Variation, SubVariation"
 */
export interface SplitOpeningName {
  /** The main opening name (before the colon) */
  opening: string;
  /** The variation name (after the colon, before the first comma), if present */
  variation?: string;
  /** The subvariation name (remainder after the first comma), if present */
  subVariation?: string;
}
