import { parseAsStringLiteral } from "nuqs/server";

// Abfuhrkreis facette for /abfall. Source-faithful tour names; "Alle" is the
// absence of the param (null), never a literal.
export const TOURS = ["nord", "sued"] as const;
export type Tour = (typeof TOURS)[number];

/** URL key for the tour facette (CLAUDE.md §4: URL is the state). */
export const TOUR_KEY = "tour";

/** Shared by the RSC loader (server parse of searchParams) and the filter
 * links. An unknown `?tour=` value parses back to null = "Alle" (no throw). */
export const tourParser = parseAsStringLiteral(TOURS);
