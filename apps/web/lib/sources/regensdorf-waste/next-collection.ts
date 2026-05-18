import { ZH_HOLIDAYS } from "./holidays";
import { RECURRING_RULES, type RecurringRule } from "./recurring-rules";

/**
 * Deterministic "next collection" for the regular weekly rules (Fork 5).
 *
 * All arithmetic is pure calendar math on `YYYY-MM-DD` strings via a Date
 * pinned to **UTC noon**: noon cannot roll across a day boundary under any
 * offset/DST, so weekday and day-add are timezone-proof. The only
 * TZ-sensitive step is deriving *today's* calendar date in Europe/Zurich
 * ({@link zurichToday}); everything downstream takes an explicit reference
 * date and is therefore unit-testable without faking the clock (test harness
 * deferred — Issue #18).
 */

export interface NextCollection {
  kind: RecurringRule["kind"];
  tour: RecurringRule["tour"];
  label: string;
  /** Effective collection date, `YYYY-MM-DD`. */
  date: string;
  /** True when the source Montag→Mittwoch holiday exception moved it. */
  shifted: boolean;
}

function utcNoon(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function fmt(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(iso: string, n: number): string {
  const dt = utcNoon(iso);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmt(dt);
}

/** getUTCDay weekday (0 = Sonntag … 6 = Samstag) for a calendar date. */
function weekday(iso: string): number {
  return utcNoon(iso).getUTCDay();
}

/** Today's calendar date in Europe/Zurich as `YYYY-MM-DD`. `en-CA` yields
 * exactly that ISO shape; the timeZone makes it correct regardless of where
 * the server runs (Vercel = UTC). */
export function zurichToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Soonest collection on/after `refIso` for one rule. We start the weekday
 * search a week *before* the reference so that a Montag already in the past
 * whose holiday-shifted Mittwoch is still ≥ ref is correctly returned (the
 * Pfingstmontag case). Lexicographic compare on `YYYY-MM-DD` is correct date
 * order.
 */
export function nextCollection(rule: RecurringRule, refIso: string): NextCollection {
  let base = addDays(refIso, -7);
  while (weekday(base) !== rule.weekday) base = addDays(base, 1);

  for (let i = 0; i < 60; i++) {
    let date = base;
    let shifted = false;
    if (rule.mondayHolidayToWednesday && weekday(base) === 1 && ZH_HOLIDAYS.has(base)) {
      date = addDays(base, 2); // Montag → Mittwoch (same week)
      shifted = true;
    }
    if (date >= refIso) {
      return { kind: rule.kind, tour: rule.tour, label: rule.label, date, shifted };
    }
    base = addDays(base, 7);
  }
  // Unreachable within a 60-week horizon for a weekly rule; fail loud rather
  // than return a wrong date.
  throw new Error(`next-collection: no occurrence found for ${rule.label} from ${refIso}`);
}

/** Next occurrence for every regular rule, soonest first. */
export function nextCollections(refIso: string): NextCollection[] {
  return RECURRING_RULES.map((r) => nextCollection(r, refIso)).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}
