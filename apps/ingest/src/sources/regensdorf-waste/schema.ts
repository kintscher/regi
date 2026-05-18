import { z } from "zod";

// Zod validates the parsed `#icmsTable-abfallsammlung` JSON island — that
// JSON is the external contract (ADR 0013). Row schema is `.strict()`: an
// i-web key add/rename is contract drift to surface loudly (skipped+counted
// per item; systematic → degraded), never silently mis-mapped. The envelope
// stays lenient (mirrors the regensdorf-news / epublikation split) so a
// DataTables config addition does not nuke the whole run.

/**
 * One special-collection row. `.strict()` over the verified 2026-05-18
 * contract; the `-sort` companions are declared so a *removed* field also
 * fails loudly. `abfallkreisIds` is a real JSON array in the source
 * (`["435","436"]`), not a stringified list.
 */
export const wasteRow = z
  .object({
    // Stable numeric id (string). Also appears in the `name` /_rte/anlass
    // href; this explicit field is the identity used for external_id.
    id: z.string(),
    "id-sort": z.string(),
    // "<a href=\"/_rte/anlass/<id>\">Kartonsammlung </a>" — the type text is
    // extracted from this in parse.ts (the single documented field regex).
    name: z.string(),
    "name-sort": z.string(),
    abfallkreisIds: z.array(z.string()),
    "abfallkreisIds-sort": z.string(),
    abfallkreisNameList: z.string(),
    "abfallkreisNameList-sort": z.string(),
    // Date wrapped in responsive <span>s; parse.ts pulls the DD.MM.YYYY.
    _anlassDate: z.string(),
    "_anlassDate-sort": z.string(),
  })
  .strict();

/**
 * Island envelope, parsed leniently: `data` stays `unknown[]` and is
 * validated row-by-row by {@link wasteRow}.
 */
export const wasteIsland = z.object({
  data: z.array(z.unknown()).default([]),
});

export type WasteRow = z.infer<typeof wasteRow>;
