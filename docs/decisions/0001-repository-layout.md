# 1. Repository layout: separate `regi-web` and `regi-ingest` as sibling directories

Date: 2026-05-17

## Status

Superseded by [ADR 0007](0007-monorepo-pnpm-workspaces.md) (2026-05-17).

The original decision (separate `regi-web` / `regi-ingest` repos, no monorepo
tooling) is kept verbatim below as accurate history. ADR 0007 reverses the
"separate repos / no monorepo tooling" stance; ADR 0008 covers the shared
`@regi/db` package that replaces the hand-synchronised cross-repo contract
noted under *Consequences*.

## Context

regi has two deployable units with incompatible runtimes and hosting targets:
the Next.js frontend on Vercel and the Cloudflare Workers ingestion layer.
`CLAUDE.md` §1 mandates two repositories (`regi-web`, `regi-ingest`).

`CLAUDE.md` §3 places `docs/` and `CLAUDE.md` inside the `regi-web` project
root. The bootstrap documents (`CLAUDE.md`, `docs/`, `initial-prompt.md`)
currently live one directory level up, at `~/repos/regi/`. The §11.1 bootstrap
command `pnpm create next-app regi-web` creates a subdirectory, which would
otherwise leave the documentation outside the project root — a contradiction
between §3 and §11.1.

## Decision

`~/repos/regi/` is an unversioned parent directory only; it must not itself
become a git repository (nested repos).

`regi-web/` and, later, `regi-ingest/` are independent git repositories living
as sibling subdirectories under that parent.

`CLAUDE.md`, `docs/` (including this decision log) and `initial-prompt.md` move
into `regi-web/`: the constitution and decision history travel with the
frontend repository. `regi-ingest/` receives its own minimal documentation when
it is created (§11.7).

## Consequences

- Matches `CLAUDE.md` §3 and resolves the §3 ↔ §11.1 contradiction.
- Clean separation of deploy targets; each repository is independently
  cloneable and deployable.
- ADRs are versioned alongside the code they govern.
- No monorepo tooling: cross-repo concerns (shared types, the
  `/api/revalidate` contract, the ingest secret) are hand-synchronised. Accepted
  because the contract surface is intentionally tiny.
- `docs/data-sources.md` is shared knowledge but lives only in `regi-web/`;
  `regi-ingest` references it by relative path. Accepted for now.
