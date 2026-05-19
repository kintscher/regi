# 14. Dashboard `/` as a single-column multi-section gazette page

Date: 2026-05-19

## Status

Accepted. Realises `docs/design-system.md` §13's named future use ("the
template for any future *multi-section* page (a future dashboard-style
overview…)"). Records the deliberate divergence from a pre-decided
desktop-2-column-grid for the medium-priority editorial trio. Relates to
ADR 0003 (design system as contract), ADR 0006 (light-mode-only-v1),
ADR 0008 (per-page query pattern), ADR 0011 (ÖV on-demand).

## Context

The Phase-3 brief pre-specified a desktop 2-column grid for the
medium-priority editorial trio (Amtliches/Gemeinde/Veranstaltungen) and
a "leichte neue Primitive `.dash-section`" — with an explicit
conditional: "Falls `/frontend-design` eine andere Architektur empfiehlt,
die ohne neue Primitives auskommt: bevorzugt (Disziplin Web Platform >
Framework-Feature)."

`/frontend-design` (CLAUDE.md §5) reviewed the proposal against the
master design system and recommended **a single continuous column at
every breakpoint for all sections**. The 2-column form cannot live
inside the system without breaking at least three of its own laws:

- **§11 forbids vertical rules.** A column reading needs a divider or
  a stark gutter. The system has zero vertical rules anywhere — by
  explicit decree ("horizontal hairlines only").
- **§1 / §13 forbid tile layouts.** "Cards imply equal-weight tiles"
  (§1); "two stacked sections still read as one calm gazette page
  scrolling down, not as two tiles" (§13). Three editorial sections
  side-by-side become tiles by spatial reading.
- **Measure discipline breaks.** Halving the 48 rem shell starves the
  `.notice` `4.75rem 1fr` grid and the 62 ch title cap; long German
  notice titles ragged-wrap badly.

3-on-2 is also ragged-bottom asymmetric, with no gazette precedent. The
system's repeated move (§9–§14) is "re-set the new requirement in the
existing grammar instead of importing a product-UI component" — and
§13 already provides the grammar for the many-sections case.

## Decision

The home page renders as **one continuous gazette column at every
breakpoint**:

- Stacked `.dash-section`s separated only by `--space-7` vertical
  space. No box, border, background, or vertical rule.
- Each section: a rubric break (§13's `.abfall__sectionhead` structure
  generalised into `.dash-section__head`) + the reused primitive
  content (`.weather`, `.ov` table, `.notice` rows) + a trailing
  **non-accent** "Alle anzeigen →" link riding the §14 chrome-link
  grammar (internal navigation → never accent).
- The new primitive is namespaced `.dash-*` — per-feature namespace,
  the established precedent. A shared `.section` generalisation
  remains the same deliberate, not-en-passant refactor as `.colophon`.
- **Zero new tokens** (colour, type, weight, spacing). §14
  token-discipline applied verbatim.

Two dashboard-only disciplines follow:

- **The dashboard is essentially accent-free.** `.notice` rows on the
  dashboard are deliberately title-only — no body, no per-row external
  `↗`. Repeating accent on 9 medium-priority rows would violate §2
  ("an accent only — never a flood"). The section's single non-accent
  "Alle anzeigen →" is the only jump affordance; per-item ext links
  live on the dedicated source pages. §1 explicitly designed the
  title-only `.notice` as a first-class "deliberate one-line gazette
  record" — the dashboard is its ideal use.
- **ÖV is a glance snapshot, not a live board.** ~5 `DepartureBoard`
  rows without the `<LiveRefresh>` client island and without the
  `.ov__status` aria-live freshness line. The data-cache (30 s)
  shields upstream; the live board with 60 s refresh lives at `/ov`
  (ADR 0011). Pre-authorised "Responsive-Kondensierung".

## Consequences

- Mobile and desktop are visually similar — the reused primitives
  self-collapse at 39.99 rem; `.dash-section__head` uses `flex-wrap`
  so "Alle anzeigen →" can drop beneath the title on narrow screens.
  No new breakpoint logic.
- **Per-page-query pattern preserved (ADR 0008).** Each section owns
  its own `unstable_cache` reusing the source's existing tag
  (`source:epublikation*`, `source:regensdorf-news`, `source:eventfrog`,
  `source:weather`, `source:regensdorf-waste`; ÖV via on-demand
  `fetchStationboard`). Extracting `/veranstaltungen`'s module-local
  grouping is deliberately not done — that would be the forbidden
  en-passant refactor (CLAUDE.md §9; hard-stop #3). Duplication is
  bounded (~30 lines) and stays under the ADR 0008 "3+ uses"
  extraction threshold.
- Each section has its own `<Suspense>` boundary; the rubric head
  renders immediately, the items area suspends with a
  `.dash-section__empty` "Wird geladen …" text placeholder at
  consistent height — no spinner (system has one motion, `regi-rise`).
- **Reversal path.** Reintroducing a desktop 2-column form is **not**
  a one-off override. It requires:
  1. A new design-system § documenting an exception to §1 ("no tiles")
     and §11 ("no vertical rules") scoped specifically to the
     dashboard, plus a contrast/measure analysis at halved width.
  2. Either a new column-gutter spacing token (no rule) or a new
     hairline-rule role (accepting a §11 carve-out).
  3. A CSS-grid extension to `.dash-section` plus a media query.
  4. A successor ADR superseding this one, with the system-level
     trade-off recorded.

  Until that work is performed, the dashboard remains single-column.

- **Operator ratification.** This ADR is the required record of a
  `/frontend-design`-recommended divergence from a pre-decision
  (hard-stop #1). The operator's own principle ("Disziplin Web
  Platform > Framework-Feature; system consistency wins") is
  exercised in writing here; this ADR can be challenged or superseded
  per the reversal path above.
