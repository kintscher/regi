# 6. Ship light mode only in v1, with a prepared dark-mode stub

Date: 2026-05-17

## Status

Accepted. Supersedes nothing. Relates to ADR 0003 (design system deferred to
after pipeline validation) and the design-system establishment in commit
`6369bf3`.

## Context

`CLAUDE.md` states a dual-mode requirement in two places:

- §5: "Light Mode ist Default (Public-Service-Charakter), Dark Mode
  gleichwertig."
- §10 Definition of Done: "Funktionalität in beiden Modes (Light/Dark) …
  geprüft."

When the design system was established (§11.5, `/frontend-design`) the operator
explicitly narrowed the first iteration to light mode only: a single warm-paper
palette designed and contrast-verified properly, rather than two half-tuned
palettes. This is a conscious deviation from `CLAUDE.md`. `CLAUDE.md` §9
requires such a deviation to be recorded as an ADR; this is that record.

## Decision

v1 ships **light mode exclusively**. Dark mode is not implemented but is
*prepared*:

- All colour is referenced through semantic tokens (`--ink`, `--accent`,
  `--paper`, …) in `app/globals.css`; no component references a raw value.
- A complete dark palette exists there as a single commented
  `@media (prefers-color-scheme: dark)` block with placeholder values flagged
  `TODO(dark): not yet contrast-verified`.
- `:root` declares `color-scheme: light` so UA controls/scrollbars do not
  dark-render against the fixed-light surface; this becomes `light dark` when
  the stub is enabled.

Enabling dark mode later is therefore: uncomment one block, tune the values,
audit contrast — no component edits.

## Consequences

- Dark-mode rollout becomes its own dedicated phase with a per-page contrast
  audit (WCAG AA), not an always-on parallel obligation. Until that phase, the
  §10 DoD "both modes" check is read as "light mode verified"; pages are
  guaranteed light-mode-tested rather than dual-mode-untested.
- Because components bind only to semantic token names, migration cost is kept
  low and contained to `app/globals.css`.
- `CLAUDE.md` §5/§10 are intentionally left as-is; they describe the target
  state. This ADR is the operative record of the v1 narrowing and is the
  document to revisit when the dark-mode phase is scheduled.
- The deviation is also stated in `docs/design-system.md` §1 and the
  `6369bf3` commit body, so it is discoverable from code, docs and history.
