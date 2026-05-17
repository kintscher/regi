# 8. Shared `@regi/db` package

Date: 2026-05-17

## Status

Accepted. Companion to [ADR 0007](0007-monorepo-pnpm-workspaces.md).

## Context

The Drizzle schema, the Neon HTTP client and the migrations are consumed by
the web app today and by the ingestion worker later. Under the monorepo
(ADR 0007) this belongs in one workspace package, not duplicated.

## Decision

`packages/db` is published in-repo as `@regi/db` (private, `workspace:*`). It
exports its TypeScript **source** (no build step):

- `@regi/db` → `src/index.ts`: the `db` instance.
- `@regi/db/schema` → `src/schema.ts`: the Drizzle tables.

**Operator re-export (decision "D-a").** `apps/web` must not depend on
`drizzle-orm` directly. `@regi/db` re-exports the operators the app needs
(`desc`, `eq` today). The principled end state is typed query functions inside
`packages/db` (`CLAUDE.md` §3/§4) so a page never touches query operators at
all; that moves logic out of the page and is therefore a **separate** change,
tracked as a follow-up issue, deliberately not part of the migration PR
("one PR, one topic", `CLAUDE.md` §9).

**Source consumption.** Because the package ships `.ts`, `apps/web`
`next.config.ts` sets `transpilePackages: ["@regi/db"]`. No `dist/` build step
is introduced — extra machinery for a single internal consumer.

**Environment (decision "Env-1").** A single `.env.local` lives at the repo
root (the one source of secrets, gitignored).

- `apps/web/.env.local` is a relative symlink `→ ../../.env.local`. Next loads
  `.env.local` from the Next project root; the symlink keeps Next's standard
  env loading intact instead of custom loader code. Symlink support verified
  on WSL2 / Linux (the development platform). If a platform cannot create the
  symlink, the documented fallback is a second physical file plus an ADR note
  recording it as a conscious trade-off.
- `packages/db/drizzle.config.ts` loads `../../.env.local` relative to cwd;
  cwd is `packages/db` because the sanctioned invocation is the root `db:*`
  scripts → `pnpm --filter @regi/db`. This mirrors the original cwd-relative
  pattern and avoids `import.meta` behaviour under the drizzle-kit bundler.

## Consequences

- One schema, one client, consumed identically by `apps/web` now and
  `apps/ingest` later (`@regi/db` as `workspace:*`).
- `apps/web` has no `drizzle-orm` in its manifest; the dependency lives only
  in `packages/db`.
- The `apps/web/.env.local` symlink is gitignored, so it is a per-clone local
  setup step (documented in `README.md`); a fresh clone creates it before
  `pnpm web dev`.
- Re-exporting operators is a stopgap; the typed-query-function refactor
  (follow-up issue) supersedes it.
- `transpilePackages` ties `apps/web`'s build to `@regi/db` source;
  acceptable for one internal consumer, revisit if external consumers appear.
