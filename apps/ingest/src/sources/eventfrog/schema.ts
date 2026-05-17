import { z } from "zod";

// Zod validates ONLY the fields a row derives from. Unknown fields are
// stripped (Zod object default; deliberately no `.passthrough()` /
// `.strict()`) so upstream additions never break ingestion. The frontend
// never sees this shape — it reads the DB table (CLAUDE.md §4).

/** Eventfrog multilingual map: `{ de?, en?, fr?, … }`, values nullable. We
 * only ever read `.de`. */
const i18n = z.object({ de: z.string().nullable().optional() });

/** emblemToShow → Image; we keep only the display URL. */
const image = z.object({ url: z.string().optional() }).nullable().optional();

/** One `events[]` entry. Parsed per-item so a single malformed event is
 * skipped, not fatal to the run (ADR 0009 / CLAUDE.md §4). */
export const eventListItem = z.object({
  id: z.string(),
  // Source-native group id: recurring occurrences share it. Always a string
  // ("64-bit int in string format"); "0" = not in a group (verified live +
  // spec). Normalised to null at mapping (ADR 0012, Source-Native Ids).
  groupId: z.string().optional(),
  rubricId: z.number().optional(),
  title: i18n,
  shortDescription: i18n.optional(),
  url: z.string(),
  organizerName: z.string().nullable().optional(),
  begin: z.string(),
  end: z.string().nullable().optional(),
  // creation date if never modified; part of the canonical raw_hash so a
  // genuine upstream edit re-upserts (ADR 0009 "Hash-1" pattern).
  modifyDate: z.string().optional(),
  // per-event alternative location name; coordinates require resolving
  // locationIds (a separate resource) — the v1 location limit (ADR 0012).
  locationAlias: i18n.optional(),
  cancelled: z.boolean().optional(),
  visible: z.boolean().optional(),
  published: z.boolean().optional(),
  emblemToShow: image,
});

/** Listing envelope, parsed leniently: `events` stays `unknown[]` here and is
 * validated item-by-item by {@link eventListItem}. The Public API returns the
 * full filtered set in one response (no pagination, verified). */
export const listEnvelope = z.object({
  totalNumberOfResources: z.number(),
  events: z.array(z.unknown()).default([]),
});

export type EventItem = z.infer<typeof eventListItem>;
