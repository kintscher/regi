/**
 * Regular weekly Kehricht/Grüngut collection rules for Regensdorf.
 *
 * These are NOT ingested rows: the source (/abfalldaten, the
 * `#regulaeresammlungen` island) models them as free-text recurrence
 * descriptions, never enumerated dates. Per Fork 5 they live here as static
 * constants and the next date is computed deterministically
 * (./next-collection.ts) — no synthetic DB rows for a recurrence the source
 * does not enumerate (CLAUDE.md §10).
 *
 * Source of truth (verbatim, last verified 2026-05-18 against
 * https://www.regensdorf.ch/abfalldaten):
 *   Grüngut  — Tour Nord: Dienstag (nördlich der Bahnlinie)
 *              Tour Süd:  Montag    (südlich der Bahnlinie)
 *              "Wenn der Montag ein Feiertag ist, findet die Grüngutsammlung
 *               jeweils am Mittwoch statt"  → applies to Tour Süd (Montag).
 *   Kehricht — Tour Nord: Freitag
 *              Tour Süd:  Donnerstag
 *
 * Only the source-documented exception is modelled. A broader holiday shift
 * (e.g. Kehricht on a holiday) is NOT invented — the source does not state
 * one. Re-verify this constant if regensdorf.ch changes the schedule.
 */

export type Tour = "nord" | "sued";
export type WasteKind = "kehricht" | "gruengut";

export interface RecurringRule {
  kind: WasteKind;
  tour: Tour;
  /** JS `Date#getUTCDay` weekday: 0 = Sonntag … 6 = Samstag. */
  weekday: number;
  /** German display label, e.g. "Grüngut – Tour Süd". */
  label: string;
  /**
   * Source-documented exception (Grüngut Tour Süd only): if the Montag of an
   * occurrence is a Zürcher Feiertag, the collection moves to the Mittwoch of
   * the same week (Montag + 2). See ./next-collection.ts.
   */
  mondayHolidayToWednesday?: boolean;
}

// Weekday constants (getUTCDay): Mo=1, Di=2, Mi=3, Do=4, Fr=5.
export const RECURRING_RULES: readonly RecurringRule[] = [
  { kind: "gruengut", tour: "nord", weekday: 2, label: "Grüngut – Tour Nord" },
  {
    kind: "gruengut",
    tour: "sued",
    weekday: 1,
    label: "Grüngut – Tour Süd",
    mondayHolidayToWednesday: true,
  },
  { kind: "kehricht", tour: "nord", weekday: 5, label: "Kehricht – Tour Nord" },
  { kind: "kehricht", tour: "sued", weekday: 4, label: "Kehricht – Tour Süd" },
];
