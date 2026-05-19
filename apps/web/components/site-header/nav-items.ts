/**
 * The flat top-level navigation — the gazette's rubric sequence (ADR-less
 * decision recorded in docs/design-system.md §14). Order is meaningful and
 * fixed: a civil/editorial block (Heute, Amtliches, Gemeinde, Veranstaltungen)
 * followed by an everyday-service cluster (Wetter, ÖV, Abfall). Adjacency
 * carries the grouping — deliberately no dropdown (§14 rationale).
 *
 * Single source of truth: the desktop masthead nav (site-nav) and the future
 * mobile drawer (Phase 5) both render from this list, so the two never drift.
 */
export interface NavItem {
  /** Route path; also the exact-match key for the active state. */
  href: string;
  /** UI label — Swiss Hochdeutsch, CH spelling. */
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Heute" },
  { href: "/amtliches", label: "Amtliches" },
  { href: "/gemeinde", label: "Gemeinde" },
  { href: "/veranstaltungen", label: "Veranstaltungen" },
  { href: "/wetter", label: "Wetter" },
  { href: "/ov", label: "ÖV" },
  { href: "/abfall", label: "Abfall" },
] as const;
