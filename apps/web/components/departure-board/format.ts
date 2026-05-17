// Pure CH helpers for the departure board. Europe/Zurich pinned (Vercel runs
// UTC; a Swiss transit board must show Swiss wall-clock time). Side-effect
// free → unit-testable once Vitest exists. Colocated per the established
// per-component precedent (cf. weather-widget/format.ts, event-card/format.ts).

const TZ = "Europe/Zurich";

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

/** Freshness phrase for the «Aktualisiert …» line — second-grained because
 * this is live data and the expectation is immediacy. */
export function relativeSince(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (s < 10) return "gerade eben";
  if (s < 60) return `vor ${s} Sek.`;
  const m = Math.floor(s / 60);
  if (m < 60) return m === 1 ? "vor 1 Min." : `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  return h === 1 ? "vor 1 Std." : `vor ${h} Std.`;
}

export type DelayLabel = { text: string; late: boolean };

/**
 * Delay rendered TYPOGRAPHICALLY, never chromatically (design-system.md §2:
 * --accent is links-only, the system is monochrome-warm — no traffic-light
 * tokens). Lateness is signalled by ink weight, not hue: «+N′» in full --ink
 * weight 600; on time is a quiet muted «pünktlich»; unknown is «—».
 */
export function delayLabel(delayMin: number | null): DelayLabel {
  if (delayMin === null) return { text: "—", late: false };
  if (delayMin <= 0) return { text: "pünktlich", late: false };
  return { text: `+${delayMin}′`, late: true };
}
