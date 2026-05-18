import { parseAsStringLiteral } from "nuqs/server";

// The regensdorf-news source categories (publications.category for this
// source). Source-faithful values, not a UI invention — see the ingest
// schema. "Alle" is the absence of the param (null), never a literal.
export const CATEGORIES = ["pressemitteilungen", "news"] as const;
export type Category = (typeof CATEGORIES)[number];

/** URL key for the category facette (CLAUDE.md §4: URL is the state). */
export const KATEGORIE_KEY = "kategorie";

/**
 * One parser, shared by the RSC loader (server, type-safe parse of the
 * searchParams promise) and the client filter (`useQueryState`). An unknown
 * `?kategorie=` value parses back to null = "Alle" (no throw).
 */
export const kategorieParser = parseAsStringLiteral(CATEGORIES);
