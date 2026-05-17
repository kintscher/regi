import { z } from "zod";

// Zod validates ONLY the fields a row derives from. Unknown fields are stripped
// (Zod object default; deliberately no `.passthrough()` / `.strict()`) so
// upstream additions never break ingestion. The frontend never sees this shape
// — it reads the DB table (CLAUDE.md §4).

/** One `payload[]` entry: existenz long-format, one row per parameter. Parsed
 * per-item so a single malformed reading is skipped, not fatal (CLAUDE.md §4). */
export const observationRow = z.object({
  timestamp: z.number(), // unix seconds — reading time of the 10-min value
  loc: z.string(), // station code, e.g. "REH"
  par: z.string(), // existenz short code: tt|rh|ff|fx|rr|qfe
  val: z.number(),
});

/** Listing envelope, parsed leniently: `payload` stays `unknown[]` and is
 * validated item-by-item by {@link observationRow}. `license`/`source` are the
 * upstream attribution strings (kept for traceability, not the sources row). */
export const latestEnvelope = z.object({
  source: z.string(),
  license: z.string(),
  payload: z.array(z.unknown()).default([]),
});

export type ObservationRow = z.infer<typeof observationRow>;
