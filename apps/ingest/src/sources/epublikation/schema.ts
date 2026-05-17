import { z } from "zod";

// Zod validates ONLY the fields the row is derived from. Unknown fields are
// ignored (Zod object default = strip; deliberately no `.passthrough()` and no
// `.strict()`) so upstream additions never break ingestion (INGEST-PLAN §c,
// risk table). The frontend never sees this shape — it reads the DB table.

const registrationOffice = z.object({
  id: z.string(),
  displayName: z.string(),
  // BFS number of the publishing office. null for SHAB/Betreibung-style
  // offices; the Regensdorf post-filter keys on this === "96".
  municipalityId: z.string().nullable(),
});

const meta = z.object({
  id: z.string(),
  rubric: z.string(),
  subRubric: z.string(),
  publicationDate: z.string(),
  // Flips when the gazette corrects a publication; part of the canonical
  // raw_hash so genuine upstream edits re-upsert (ADR 0009 "Hash-1").
  updateDate: z.string(),
  registrationOffice: registrationOffice.nullable(),
  title: z.object({ de: z.string() }),
});

/** One `content[]` entry. Parsed per-item so a single malformed publication is
 * skipped, not fatal to the run (ADR 0009 / CLAUDE.md §4). */
export const publicationListItem = z.object({ meta });

/** Listing envelope, parsed leniently: `content` stays `unknown[]` here and is
 * validated item-by-item by {@link publicationListItem}. */
export const listEnvelope = z.object({
  total: z.number(),
  content: z.array(z.unknown()).default([]),
});

export type EpublicationItem = z.infer<typeof publicationListItem>;
export type EpublicationMeta = z.infer<typeof meta>;
