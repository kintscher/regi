import { z } from "zod";

// Zod validates the parsed `data-entities` JSON island — for this source class
// that JSON *is* the external contract (ADR 0013). Unlike the API sources
// (epublikation deliberately strips so additive API fields never break it),
// embedded-JSON scraping uses `.strict()` at the row level: a CMS that
// adds/renames an island field is contract drift we want to surface loudly,
// not silently mis-map (ADR 0013 mitigations). Drift then fails per-item
// (skipped+counted, ADR 0009) and, if systematic, zeroes the run → degraded.

/**
 * One DataTables row of the `#informationList` island. `.strict()`: every
 * known i-web key is declared; an unexpected key fails this row. The `-sort`
 * and `_*` companions are part of the verified 2026-05-18 contract and are
 * declared so a *removed* field also fails loudly (not just added ones).
 */
export const newsRow = z
  .object({
    // "<a href=\"/_rte/information/<id>\">Title</a>" — id + title are
    // extracted from this in parse.ts (the single documented field regex).
    name: z.string(),
    "name-sort": z.string(),
    datum: z.string(),
    "datum-sort": z.string(),
    _thumbnail: z.string(),
    // Sortable "YYYY-MM-DD HH:MM:SS" (local); the row's publishedAt source.
    _datum: z.string(),
    "_datum-sort": z.string(),
    // "news" | "pressemitteilungen" observed; kept as free string (a new
    // category is content, not structural drift — ADR 0013 strictness is
    // about keys, not values; CLAUDE.md: union strings, no enums).
    _kategorieId: z.string(),
    "_kategorieId-sort": z.string(),
  })
  .strict();

/**
 * Island envelope, parsed leniently (mirrors the epublikation envelope split):
 * a DataTables config addition at this level must not nuke the whole run —
 * drift detection lives at the row level above. `data` stays `unknown[]` and
 * is validated row-by-row by {@link newsRow}.
 */
export const newsIsland = z.object({
  data: z.array(z.unknown()).default([]),
});

export type NewsRow = z.infer<typeof newsRow>;
