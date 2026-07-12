/**
 * Source of the opening data in eco.json.
 *
 * eco_tsv is the authoritative source — when it conflicts with any other
 * source, eco_tsv wins and the other source's name moves to aliases.
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
 * Human-readable metadata for each opening data source.
 * Useful for UI display, documentation, and debugging.
 */
export const SOURCE_META = {
  eco_tsv: { label: "Lichess", url: "https://github.com/lichess-org/chess-openings" },
  eco_js: { label: "chess.js / chessops", url: "https://github.com/niklasf/chessops" },
  scid: { label: "SCID", url: "https://scid.sourceforge.net/" },
  eco_wikip: { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Chess_opening" },
  "eco_wikip.g": { label: "Wikipedia Gambits", url: "https://en.wikipedia.org/wiki/List_of_chess_gambits" },
  wiki_b: { label: "Wikibooks Opening Theory", url: "https://en.wikibooks.org/wiki/Chess_Opening_Theory" },
  fics: { label: "FICS", url: "https://www.freechess.org/" },
  ct: { label: "ChessTempo", url: "https://www.chesstempo.com/" },
  chessGraph: { label: "Chess-Graph", url: "https://github.com/Destaq/chess-graph" },
  chronos: { label: "Chronos / pgn-extract", url: "https://www.cs.kent.ac.uk/people/staff/djb/pgn-extract/" },
  icsbot: { label: "ICS Bot", url: undefined },
  pgn: { label: "PGN (generic)", url: undefined },
  interpolated: { label: "Interpolated (generated)", url: undefined },
} satisfies Record<OpeningSource, { label: string; url?: string }>;

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
