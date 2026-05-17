// Pure CH-locale formatters + the conservative weather descriptor. Kept
// side-effect-free so they are trivially unit-testable once Vitest exists
// (CLAUDE.md §2/§10; test infra is a separate, tracked concern).

/** UI shape: the data layer serialises Date → ISO string across the
 * unstable_cache boundary (same discipline as /amtliches getNotices). */
export type WeatherObservation = {
  observedAt: string; // ISO
  tempC: number | null;
  rhPct: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  precipMm: number | null;
  pressureHpa: number | null;
};

const DASH = "—";

const intCH = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });
const tempCH = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
// timeZone pinned to Europe/Zurich on purpose: Vercel runs UTC, but a Swiss
// public-service site must always render Swiss wall-clock time regardless of
// where the server sits. The canonical ISO lives in <time datetime>.
const TZ = "Europe/Zurich";

const dateCH = new Intl.DateTimeFormat("de-CH", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeCH = new Intl.DateTimeFormat("de-CH", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** CH editorial time: HH.MM with a dot, not a colon (CLAUDE.md §1). */
export function fmtTimeCH(iso: string): string {
  return timeCH.format(new Date(iso)).replace(":", ".");
}

export function fmtDateCH(iso: string): string {
  return dateCH.format(new Date(iso));
}

/** «17.05.2026, 21.00» — date then CH-dot time. */
export function fmtDateTimeCH(iso: string): string {
  return `${fmtDateCH(iso)}, ${fmtTimeCH(iso)}`;
}

/** Temperature: one decimal, CH locale, explicit sign never forced. */
export function fmtTemp(v: number | null): string {
  return v === null ? DASH : tempCH.format(v);
}

/** Rounded integer params (humidity, wind, gust, pressure). */
export function fmtInt(v: number | null): string {
  return v === null ? DASH : intCH.format(Math.round(v));
}

/** Precipitation: exact 0 stays «0», any rain keeps one decimal. */
export function fmtPrecip(v: number | null): string {
  if (v === null) return DASH;
  return v === 0 ? "0" : tempCH.format(v);
}

/**
 * Terse, data-faithful German descriptor. Derived ONLY from real fields —
 * the feed has no condition field, so no invented «sonnig/bewölkt». Just the
 * two facts we actually measure: precipitation and (if notable) wind.
 */
export function describe(o: WeatherObservation): string {
  if (o.tempC === null) return "";
  const base = o.precipMm !== null && o.precipMm > 0 ? "Niederschlag" : "trocken";
  if (o.windKmh !== null && o.windKmh >= 20) return `${base} · windig`;
  return base;
}
