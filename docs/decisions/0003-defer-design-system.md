# 3. Defer the design system until after pipeline validation

Date: 2026-05-17

## Status

Accepted

## Context

`CLAUDE.md` §11 originally ordered `/frontend-design` as step 4 — before the
first `/amtliches` page existed. The design system would then be produced
against assumptions about content shape, density and length rather than against
the real thing. `CLAUDE.md`'s own guiding principle (§11, last line) is
"Pipeline before content before polish."

No brand assets are cleared for the MVP (no municipal coat of arms, no licensed
typefaces); the only permitted starting points for `/frontend-design` are a
system font stack and Geist (OFL).

## Decision

Move `/frontend-design` to run **after** the `/amtliches` page renders real
(mock) data end-to-end:

1. Scaffold (done)
2. Neon
3. Drizzle schema + first migration
4. `/amtliches` with hardcoded mock data — neutral, no design system: black on
   white, system font. Sole purpose: validate the pipeline.
5. `/frontend-design` with the §5 context **and** the standing `/amtliches`
   page as input → `docs/design-system.md` + `app/globals.css`; then rework
   `/amtliches` in that style.
6. `/web-design-guidelines` + `/impeccable`, iterate.

Until step 5, no design work at all — not even rough tokens. The scaffold's
default `globals.css` stays untouched (reverting or altering it would itself be
a design decision).

## Consequences

- The design system is informed by real content density and component needs,
  not guesses; fewer rework cycles.
- Step 4 ships deliberately ugly. Accepted: it exists only to prove the
  RSC → Drizzle → Neon → page path works.
- `CLAUDE.md` §11 is updated in the same commit to reflect the new order and
  point here. §5 ("Design system at the beginning") is left as-is for now;
  §11 is the operative sequence and references this ADR.
- `CLAUDE.md` §11.3's table list is not yet narrowed to `sources` +
  `publications` (the agreed skeleton scope); that is a separate concern,
  applied and recorded when step 3 is executed.
