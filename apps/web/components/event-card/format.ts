// Pure CH-locale helpers + the staffelung sub-line. Side-effect-free so they
// are trivially unit-testable once Vitest exists (CLAUDE.md §2/§10). Colocated
// per the established per-component precedent (cf. weather-widget/format.ts);
// a shared lib/format extraction is a separate, deferred concern.

/** One aggregated event series (or a single ungrouped event). The page's
 * cached query builds these; the card is purely presentational. */
export type EventGroup = {
  key: string;
  title: string;
  url: string; // the next occurrence's Eventfrog URL
  locationName: string | null;
  organizerName: string | null;
  next: string; // ISO — earliest upcoming start_at
  last: string; // ISO — latest upcoming start_at in the group
  furtherCount: number; // upcoming occurrences AFTER `next`
};

// Europe/Zurich pinned: Vercel runs UTC, a Swiss public-service site must
// always render Swiss wall-clock time. Canonical ISO lives in <time datetime>.
const TZ = "Europe/Zurich";

const dateCH = new Intl.DateTimeFormat("de-CH", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dayMonthCH = new Intl.DateTimeFormat("de-CH", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
});
const timeCH = new Intl.DateTimeFormat("de-CH", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** «17.05.2026» — the gutter date. */
export function fmtDateCH(iso: string): string {
  return dateCH.format(new Date(iso));
}

/** «01.10.» — day.month with exactly one trailing period, for «… bis 01.10.».
 * de-CH already emits a trailing dot for day/month-only; normalise so the
 * result is locale-independent and never doubled. */
export function fmtDayMonthCH(iso: string): string {
  return `${dayMonthCH.format(new Date(iso)).replace(/\.$/, "")}.`;
}

/** CH editorial time: HH.MM with a dot, not a colon (CLAUDE.md §1). */
export function fmtTimeCH(iso: string): string {
  return timeCH.format(new Date(iso)).replace(":", ".");
}

/**
 * Staffelung sub-line. A daily series is «wiederkehrend», not «137 Termine»:
 * the phrasing scales with how a reader actually thinks about the cadence.
 * Returns null when there is nothing beyond the next date (no sub-line).
 */
export function seriesLine(furtherCount: number, lastIso: string): string | null {
  if (furtherCount <= 0) return null;
  const until = fmtDayMonthCH(lastIso);
  if (furtherCount === 1) return `1 weiterer Termin am ${until}`;
  if (furtherCount <= 10) return `${furtherCount} weitere Termine bis ${until}`;
  // cadence is unknown (could be daily, weekly, irregular) → the accurate,
  // non-overclaiming word is «wiederkehrend», never «Tagesserie».
  return `Wiederkehrend bis ${until}`;
}
