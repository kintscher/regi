# 2. Pin Next.js to the current stable major (16)

Date: 2026-05-17

## Status

Accepted

## Context

`CLAUDE.md` §2 mandates "Next.js App Router (aktuelle stable Major)" and §9
requires recording the chosen major in an ADR. The bootstrap ran
`pnpm create next-app@latest`, which resolved the current stable major.

create-next-app emitted an `AGENTS.md` warning that this Next.js major has
breaking changes versus older conventions and that the bundled docs under
`node_modules/next/dist/docs/` must be consulted before writing app code.

## Decision

Adopt the current stable major, **Next.js 16**, pinned to exact versions as
scaffolded:

- `next` 16.2.6
- `react` 19.2.4, `react-dom` 19.2.4
- `typescript` 5.9.x, `tailwindcss` 4.x, `@tailwindcss/postcss` 4.x

Dependencies are pinned exactly (no `^`) for app-critical packages going
forward; upgrades are deliberate, reviewed changes, never implicit.

Before writing App Router / RSC / route handler code, consult
`node_modules/next/dist/docs/` and `AGENTS.md`; do not rely on pre-16
conventions from memory.

## Consequences

- Matches `CLAUDE.md` §2; the version is now traceable.
- Tailwind v4 CSS-first is confirmed by the scaffold (`@import "tailwindcss"`,
  `@tailwindcss/postcss`, no `tailwind.config.ts`), satisfying §2.
- Next 16 has behavioural changes (caching, params, route APIs) that differ
  from training-data assumptions; the `AGENTS.md` guardrail is kept in the repo
  to enforce checking the bundled docs.
- Exact pinning trades automatic patch updates for reproducible builds and
  reviewable upgrades. Accepted for a content-aggregation site where stability
  outweighs always-latest.
- Re-evaluate when a new stable major ships or a security advisory requires a
  bump; record the bump as its own ADR or PR rationale.
