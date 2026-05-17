# 9. apps/ingest stack & worker architecture

Date: 2026-05-17

## Status

Accepted. Companion to [ADR 0007](0007-monorepo-pnpm-workspaces.md) and
[ADR 0008](0008-shared-db-package.md). Implements `CLAUDE.md` §11 step 8.
Records a deliberate, scoped deviation from `CLAUDE.md` §2 (Hono).

## Context

`apps/ingest` is the second deployable unit: a Cloudflare Worker that polls
external sources on cron triggers, upserts into Neon via `@regi/db`, writes a
raw audit trail to R2, and POSTs cache-invalidation tags to the web app. The
first source is ePublikation; its API was verified live (see the §11.6 ingest
plan and [ADR 0010](0010-public-api-vs-robots.md)). Architecture chosen here
applies to every future source, so it is fixed before any source code exists.

`CLAUDE.md` §2 lists the ingest stack as "Cloudflare Workers + Hono + Drizzle".
A cron-only worker needs no HTTP router; `wrangler dev --test-scheduled`
exercises the `scheduled()` handler directly. Forcing Hono in for v1 is a
dependency with no consumer.

`@regi/db` (ADR 0008) builds its `db` instance at module load from
`process.env.DATABASE_URL`. A Worker has no ambient `process.env` at module
init — environment arrives as the `env` argument to `scheduled`/`fetch`.
Relying on a `nodejs_compat` `process.env` polyfill at import time is exactly
the "Web Platform > Framework feature" anti-pattern `CLAUDE.md` §9 warns about.

## Decision

**Runtime.** Wrangler v4. `compatibility_flags = ["nodejs_compat"]` is set
unconditionally: `ulid()` and `node:crypto` `createHash` (raw-hash, ADR 0008
pattern) are on the hot path. `compatibility_date` is pinned at scaffold time
and only moved deliberately.

**No Hono in v1 (deviation from `CLAUDE.md` §2).** v1 ships a single
`scheduled()` handler plus a minimal `fetch()` handler exposing exactly one
secret-guarded route, `POST /__run` (local/manual trigger; production cron uses
`scheduled()`). Hono is introduced — and `CLAUDE.md` §2 thereby satisfied —
when **any** of these triggers is hit, whichever comes first:

1. the worker needs **4 or more** HTTP routes, or
2. the first **inbound webhook receiver** from an external system is added, or
3. the first **health/status endpoint** intended for external monitoring.

Until then "later" is concrete, not open-ended. Adding Hono is a one-topic PR
with its own ADR amendment.

**`@regi/db` factory (decision "Db-2").** `@regi/db` gains an additive export
`createDb(connectionString: string)` returning a configured Drizzle instance.
The argument is the connection **string only** — never the Worker `env` object
— so `@regi/db` stays platform-agnostic (no Cloudflare types leak in). The
existing default `db` export and operator re-exports (ADR 0008 "D-a") are
unchanged: `apps/web` is untouched. `apps/ingest/src/lib/db.ts` calls
`createDb(env.DATABASE_URL)` inside the handler, where `env` exists. This also
unblocks the typed-query-function follow-up (ADR 0008) without further API
churn.

**Worker layout.**

```
apps/ingest/src/
  index.ts              # scheduled(); fetch() → guarded POST /__run only
  sources/registry.ts   # ordered [{ slug, run }]; each run isolated in try/catch
  sources/epublikation/
    index.ts            # fetch → filter → map → upsert → revalidate
    schema.ts           # Zod (Worker-only: validates the external API shape)
    constants.ts        # tunables, each citing this ADR
  lib/db.ts             # createDb(env.DATABASE_URL)
  lib/r2.ts             # content-addressed raw audit write
  lib/revalidate.ts     # POST { tags } → SITE_URL/api/revalidate
```

Zod schemas live with the source (`sources/<name>/schema.ts`), not in
`packages/db`: they validate the external API contract that only the worker
sees (`CLAUDE.md` §4 — the frontend reads the DB, never raw data). One failing
source must not break the cron run: the registry runs each source in its own
`try/catch`; within a source each item is parsed independently — a Zod failure
logs, skips that item, increments a counter, and the run continues
(`CLAUDE.md` §4).

**`raw_hash` stability (decision "Hash-1").** `publications.raw_hash` is the
SHA-256 of a **canonical projection of the item's stable fields in fixed key
order**, not of the whole server response. The list response carries volatile
data (per-request correlation ids, server timestamps, pagination echo); hashing
it verbatim would make every poll look "changed" and churn updates + revalidate
POSTs. The canonical projection is the minimal set the row is derived from
(publication id, title, publicationDate, rubric/subRubric, registrationOffice
identity); `meta.updateDate` is included so genuine upstream corrections do flip
the hash. Implemented as a documented `canonicalItemFields()` helper with an
inline comment pointing here.

**Plausibility cap (decision "Cap-1").** The ePublikation read API silently
returns the *global* dataset (~2.7M) when a filter parameter is unrecognised
(verified, see §11.6 plan / ADR 0010). The expected scoped result
(`tenant=kabzh` + `cantons=ZH` + a date window + client-side
`municipalityId === "96"`) is hundreds of items at most. The worker therefore
treats `total > 5000` as a **degraded run**: it logs an error, does **not**
persist, and does **not** advance `sources.last_synced_at`, so a broken filter
cannot poison the table or the freshness signal. The threshold lives in
`sources/epublikation/constants.ts` (`PLAUSIBILITY_MAX_TOTAL = 5000`) with a
comment citing this ADR — never a magic number at a call site.

**Source initialisation.** No separate seed script. Each run calls an
idempotent `ensureSource()` (`INSERT … ON CONFLICT (slug) DO UPDATE SET
name, url, license, last_synced_at = now()`), so a fresh Neon branch plus the
first cron tick is sufficient — no manual step (`CLAUDE.md` §9, "works in 12
months"). Real-source slug: `epublikation`. The dev-only mock fixture keeps its
separate slug `epublikation-test` (seed-mock, unchanged).

## Consequences

- One worker shape reused by every future source (registry + per-source dir +
  shared `lib/`); adding a source is a directory plus a registry line.
- `apps/web` is untouched by the `@regi/db` change (additive export only);
  `pnpm -r typecheck` now also covers `apps/ingest`.
- The Hono deviation from `CLAUDE.md` §2 is bounded by explicit, testable
  triggers rather than indefinitely deferred.
- `raw_hash` over canonical fields makes re-polls idempotent and keeps
  revalidate traffic proportional to real change; the trade-off is that the
  hash is a deliberate projection, not a byte-faithful record of the response
  (the byte-faithful record is the R2 raw object, ADR pending in the plan §d).
- A misconfigured filter degrades loudly and harmlessly instead of importing
  millions of rows.
- `nodejs_compat` ties the worker to that Workers feature; acceptable — it is a
  stable platform compat flag, not a framework abstraction.
