import { z } from "zod";

// Zod validates ONLY the fields the board renders. Unknown fields stripped
// (no .passthrough()/.strict()) so upstream additions never break the page.
// The page consumes typed data, never raw JSON (CLAUDE.md §4, on-demand
// path — ADR 0011). transport.opendata.ch is community-maintained and
// informal, so every field is treated as optional/nullable defensively.

const prognosis = z.object({
  departure: z.string().nullable().optional(), // real-time predicted departure
});

const stop = z.object({
  departure: z.string().nullable().optional(), // scheduled, ISO with offset
  departureTimestamp: z.number().nullable().optional(), // unix seconds
  delay: z.number().nullable().optional(), // minutes
  platform: z.string().nullable().optional(),
  prognosis: prognosis.optional(),
});

/** One `stationboard[]` entry; parsed per-item so a single malformed
 * departure is skipped, not fatal (mirrors the cron sources' leniency). */
export const stationboardEntry = z.object({
  stop,
  name: z.string().nullable().optional(),
  category: z.string().nullable().optional(), // "S" | "B" | "T" | "IR" …
  number: z.string().nullable().optional(), // line number, e.g. "6"
  operator: z.string().nullable().optional(),
  to: z.string().nullable().optional(), // destination
});

export const stationboardResponse = z.object({
  station: z
    .object({ id: z.string().nullable().optional(), name: z.string().nullable().optional() })
    .optional(),
  stationboard: z.array(z.unknown()).default([]),
});

export type StationboardEntry = z.infer<typeof stationboardEntry>;
