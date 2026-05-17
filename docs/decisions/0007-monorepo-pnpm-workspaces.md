# 7. Monorepo with pnpm workspaces (supersedes ADR 0001)

Date: 2026-05-17

## Status

Accepted. Supersedes [ADR 0001](0001-repository-layout.md).

## Context

ADR 0001 chose two independent repositories (`regi-web`, `regi-ingest`) with
no monorepo tooling, accepting hand-synchronised cross-repo concerns "because
the contract surface is intentionally tiny". That surface is not tiny: the
Drizzle schema, the Neon client wiring, the `/api/revalidate` tag contract and
the ingest secret are all shared, and the worker is not built yet — so each of
those would have to be duplicated and kept in sync by hand the moment
`regi-ingest` exists. The frontend already carried the only copy of the schema
and `docs/data-sources.md`, which ADR 0001 itself flagged as an
accepted-for-now wart.

Two deploy targets (Vercel for web, Cloudflare for the worker) do not require
two repositories — only two deployable directories. One repo with pnpm
workspaces gives a single lockfile, one home for the schema, atomic
cross-cutting changes, and `git log --follow` across the move.

## Decision

`~/repos/regi/` **is** the single git repository (this reverses ADR 0001's
"must not itself become a git repository"). Layout:

- `apps/web` (`@regi/web`) — Next.js, deploys to Vercel (project root
  `apps/web`).
- `apps/ingest` (`@regi/ingest`) — Cloudflare Workers, not yet created (§11).
- `packages/db` (`@regi/db`) — shared Drizzle schema + Neon client +
  migrations (see ADR 0008).
- `docs/`, `CLAUDE.md`, `.githooks/`, `biome.json`, `tsconfig.base.json` live
  at the repo root and are shared.

`pnpm-workspace.yaml` declares `apps/*` and `packages/*`. The root
`package.json` is private and dependency-free; it proxies scripts to the
workspaces (`pnpm web …`, `pnpm -r typecheck`, `pnpm db:* → --filter
@regi/db`, repo-wide `biome check`). The versioned pre-commit hook file is
unchanged — only the root script definitions became workspace-aware.

History was preserved: a filesystem lift of `.git` plus the working tree up
one level (paths relative to the repo root unchanged → zero diff), then pure
`git mv` into `apps/web` / `packages/db` as one commit kept separate from the
content rewiring, so rename detection stays exact. The GitHub repository
`kintscher/regi-web` is renamed to `kintscher/regi`.

## Consequences

- One lockfile, one schema, atomic cross-cutting changes; the ADR 0001
  hand-sync wart is gone.
- `git log --follow` traverses the relocation; the 11 pre-migration commits
  are untouched (additive history, no force-push).
- Vercel must be configured with project root `apps/web`; the future
  Cloudflare deploy targets `apps/ingest`. Not blocking — nothing is deployed
  yet.
- `pnpm -r typecheck` currently checks `apps/web` + `packages/db`; once
  `apps/ingest` exists it also runs on worker changes. Filtering the
  pre-commit hook by staged workspace is deferred (follow-up issue).
- ADR 0001 remains in the log as honest history with a Superseded status.
