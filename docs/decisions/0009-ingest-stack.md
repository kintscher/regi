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

**`@regi/db` factory (decision "Db-2").** `@regi/db` gains an additive,
**side-effect-free** export `createDb(connectionString: string)` returning a
configured Drizzle instance. The argument is the connection **string only** —
never the Worker `env` object — so `@regi/db` stays platform-agnostic (no
Cloudflare types leak in). It lives at its own subpath **`@regi/db/client`**
(`src/client.ts`), not at the package index: `@regi/db` (index) reads
`process.env.DATABASE_URL` at the top level and throws if unset, and JS module
semantics run that on *any* import from the index — including the Worker's.
The subpath is the side-effect-free entry the Worker imports; it follows the
existing subpath-export pattern of ADR 0008 (`./schema`). The index keeps its
eager `db` export and the operator re-exports (ADR 0008 "D-a") and internally
builds `db` via `createDb`: `apps/web` is untouched. `apps/ingest/src/lib/db.ts`
imports `createDb` from `@regi/db/client` and calls `createDb(env.DATABASE_URL)`
inside the handler, where `env` exists. This also unblocks the
typed-query-function follow-up (ADR 0008) without further API churn.

**Worker layout.**

```
apps/ingest/src/
  index.ts              # scheduled(); fetch() → guarded POST /__run only
  sources/registry.ts   # ordered [{ slug, run }]; each run isolated in try/catch
  sources/epublikation/
    index.ts            # fetch → filter → map → upsert → revalidate
    schema.ts           # Zod (Worker-only: validates the external API shape)
    constants.ts        # tunables, each citing this ADR
  lib/db.ts             # createDb(env.DATABASE_URL) from "@regi/db/client"
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

**Plausibility caps (decisions "Cap-1" global, "Cap-2" per-source).** The
ePublikation read API silently returns the *global* dataset (~2.7M) when a
filter parameter is unrecognised (verified, see §11.6 plan / ADR 0010). A
degraded run logs an error, does **not** persist, and does **not** advance
`sources.last_synced_at`, so a broken filter cannot poison the table or the
freshness signal. Two layered thresholds:

- **Cap-1 (global, `PLAUSI_CAP = 5000`)** — the worst-case sanity guard for
  unknown API drift, conceptually applicable to *any* source. Anything beyond
  this is unambiguously the unfiltered fall-through.
- **Cap-2 (per-source, ePublikation `PLAUSI_TOTAL_MAX = 1000`)** — an
  empirically-grounded bound. Verified 2026-05-17: the production query
  `keyword=Regensdorf&cantons=ZH&publicationStates=PUBLISHED` over a 30-day
  window returns `total = 168` (191 without `cantons`). 1000 leaves generous
  headroom for spikes yet trips long before Cap-1 and far before the global
  fall-through, so it is the operative degraded gate for this source (it
  subsumes Cap-1 here, 1000 < 5000; both are kept so the global guarantee
  stays explicit). `MAX_PAGES = 10` additionally hard-caps the pagination
  loop (rate-discipline, ADR 0010).

Future sources add their **own** Cap-2 to their `constants.ts` rather than
rewriting the global Cap-1. Both live in
`apps/ingest/src/sources/epublikation/constants.ts` with comments citing this
ADR and the verification date — never a magic number at a call site.

> Note: an earlier draft of this ADR and the §11.6 plan assumed a
> `tenant=kabzh&cantons=ZH` query yielding "hundreds of items". Live
> verification disproved that (`total = 7308`/30d, ~2 Regensdorf hits per 500
> rows). The source query is `keyword=Regensdorf&cantons=ZH` with a
> client-side `registrationOffice.municipalityId === "96"` post-filter; the
> Cap values above reflect the verified query. See the amendment note.

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

## Amendment (2026-05-17, same day, pre-implementation)

Decision "Db-2" originally placed `createDb` on the package index
(`@regi/db`). During implementation it was relocated to the dedicated
side-effect-free subpath **`@regi/db/client`** (`src/client.ts`): importing
anything from the index runs its top-level `process.env.DATABASE_URL` read
and throw (JS module semantics), which a Worker import would trigger and which
contradicts this ADR's own anti-`process.env`-at-import-time stance. The Db-2
text and the worker-layout block above are written to the amended (subpath)
form; this note records the change. No code had shipped against the index
form.

## Amendment (2026-05-17, Sub-Schritt 3, pre-implementation)

"Cap-1" was split into **Cap-1 (global)** + **Cap-2 (per-source)** after live
verification disproved the assumed source query. The original draft assumed
`tenant=kabzh&cantons=ZH` returns "hundreds of items"; measured `total` is
7308 for a 30-day window, with only ~2 Regensdorf (`municipalityId === "96"`)
rows per 500, so that query is both above any sane single cap and too sparse
to page. The verified query is `keyword=Regensdorf&cantons=ZH&
publicationStates=PUBLISHED` (`total = 168`/30d; AND-combination and the
`cantons=BE` control confirmed) with the same client-side `municipalityId ===
"96"` post-filter. `keyword` is server-side full text; if it is empty under
the defense-in-depth `cantons=ZH` the source falls back to keyword-only (the
post-filter still guarantees Regensdorf precision). The Plausibility section
above is written in the amended form. Constants: `PLAUSI_CAP = 5000`
(Cap-1), `PLAUSI_TOTAL_MAX = 1000`, `MAX_PAGES = 10` (Cap-2). The residual
keyword-full-text gap is tracked as a follow-up (registrationOffices filter
verification). No code had shipped against the old query.
