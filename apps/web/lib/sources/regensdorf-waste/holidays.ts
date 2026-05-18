/**
 * Gesetzliche Feiertage Kanton Zürich, as `YYYY-MM-DD` calendar dates.
 *
 * Used only by the Grüngut-Tour-Süd Montag→Mittwoch exception
 * (./next-collection.ts, Fork 5) and for /abfall display. A local constant by
 * design: dependency-free, deterministic, and stable for 12 months (CLAUDE.md
 * §9 — Web Platform / no npm holiday lib for a 20-line set). Easter-derived
 * dates (Karfreitag, Ostermontag, Auffahrt, Pfingstmontag) are pre-computed,
 * not calculated at runtime, so the set is auditable by eye.
 *
 * Scope: 2026 + 2027 (the horizon the recurrence computation needs).
 * KNOWN LIMITATION: extend this set before 2028 — tracked as a follow-up
 * issue, not an untracked TODO. After the last covered year the holiday
 * exception silently stops applying (collections still compute, just without
 * the shift), which is a safe degradation, not a crash.
 *
 * Verified 2026-05-18 against the Kanton-Zürich list (Neujahr, Berchtoldstag,
 * Karfreitag, Ostermontag, Tag der Arbeit, Auffahrt, Pfingstmontag,
 * Bundesfeier, Weihnachten, Stephanstag).
 */
export const ZH_HOLIDAYS: ReadonlySet<string> = new Set<string>([
  // 2026
  "2026-01-01", // Neujahr
  "2026-01-02", // Berchtoldstag
  "2026-04-03", // Karfreitag
  "2026-04-06", // Ostermontag        (Montag)
  "2026-05-01", // Tag der Arbeit
  "2026-05-14", // Auffahrt
  "2026-05-25", // Pfingstmontag      (Montag)
  "2026-08-01", // Bundesfeier
  "2026-12-25", // Weihnachten
  "2026-12-26", // Stephanstag
  // 2027
  "2027-01-01", // Neujahr
  "2027-01-02", // Berchtoldstag
  "2027-03-26", // Karfreitag
  "2027-03-29", // Ostermontag        (Montag)
  "2027-05-01", // Tag der Arbeit
  "2027-05-06", // Auffahrt
  "2027-05-17", // Pfingstmontag      (Montag)
  "2027-08-01", // Bundesfeier
  "2027-12-25", // Weihnachten
  "2027-12-26", // Stephanstag
]);
