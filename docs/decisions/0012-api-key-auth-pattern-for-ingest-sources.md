# 12. API-key authentication pattern for ingest sources (Eventfrog)

Date: 2026-05-17

## Status

Accepted. Companion to [ADR 0009](0009-ingest-stack.md) (ingest stack) and
[ADR 0008](0008-shared-db-package.md). First instance: the Eventfrog source.
Records a minor deviation from `docs/data-sources.md` §G1 in the same posture
as [ADR 0010](0010-public-api-vs-robots.md). ADR-numbering note: ADR 0011
(Transport on-demand) is reserved for Source 3 and will be written when that
source is built; this ADR is 0012 by topic assignment (SOURCE-STRATEGY), not
creation order.

## Context

ADR 0009 fixed the worker architecture for **unauthenticated** sources
(ePublikation; the Existenz weather source was added under it unchanged).
Eventfrog is the first source that needs a **credential**, so the pattern for
credential handling must be fixed before the first auth-source code exists —
exactly the discipline ADR 0009 applied to the source mechanic itself. This
pattern governs *every* future auth source (commercial weather, press APIs,
ticketing), not only Eventfrog.

Live verification 2026-05-17 (User-Agent `regi/1.0 …`, no persistence)
overrides `docs/data-sources.md` §G1:

| §G1 assumption | Verified reality |
| --- | --- |
| "Registrierung als **Partner**" | Self-service **Public API**, no partner contract. `GET https://api.eventfrog.net/public/v1/events`. |
| (auth unspecified) | `Authorization: Bearer <key>` — HTTP 200 with the `.env.local` `EVENTFROG_API_KEY`; HTTP 401 `application/problem+json` (`"Please provide a bearer token"`) without. |
| "Filter auf Ort Regensdorf" | Server filter `zip` (repeatable), `lat/lng/r`, `modifiedSince` (delta), `q`. Locality gate decided: strict `zip=8105&zip=8106` (see SOURCE-STRATEGY; precision over recall; zip-less events are a documented v1 gap, issue #12). |

ADR 0009 (Db-2) already established that a Worker has no ambient
`process.env`; bindings arrive as the `env` argument. A credential must follow
that same path, not a `nodejs_compat` `process.env` read at import time.

## Decision

A reusable **API-key authentication pattern** for `apps/ingest` sources. The
Eventfrog source is its first conformant instance; every later auth source
cites this ADR instead of re-deciding.

### Key storage

- **Local:** repo-root `.env.local` (gitignored; surfaced to the worker via
  the existing `apps/ingest/.dev.vars` symlink, ADR 0009). The variable is
  **source-specific** — `EVENTFROG_API_KEY`, never a generic
  `INGEST_API_KEY`. Source-specific names make the per-source provisioning
  obligation explicit and prevent one leaked key compromising all sources.
- **Production:** `wrangler secret put EVENTFROG_API_KEY` (Cloudflare secret
  store). Never in `wrangler.toml`, never committed.
- **Never:** hardcoded; in a URL query parameter; in any log line (not even a
  prefix/length); in the R2 audit object (the audit stores the *response*
  body only — the key lives in a request header and never appears there).

### Consumption in the worker

- Read **only** via `env.EVENTFROG_API_KEY` (worker binding), never
  `process.env` (consistent with ADR 0009 Db-2; no import-time env read).
- The key is added to the `Env` interface as a required `string` — that is
  the **deploy contract**. Defense-in-depth for a mis-provisioned production
  secret: the source guards `if (!env.EVENTFROG_API_KEY)` at the top of its
  run and returns `degraded` (no fetch, no persist, no freshness advance) —
  it never throws/crashes the cron.
- The credential is **worker-only**. `apps/web` reads the DB and never the
  external API (CLAUDE.md §4), so the key is exclusively in `apps/ingest`'s
  `Env` and must never be added to any `apps/web` environment.
- **Rotation is non-breaking:** `wrangler secret put` overwrites; the next
  scheduled tick reads the new value from the binding. No code change, no
  redeploy of logic.

### Rate-limit handling (reasoned deviation from "exponential backoff")

Eventfrog's documented budget is generous (≈30 req/min, ≈2000 req/day per
account); a zip-filtered hourly poll issues 1–2 requests per run — orders of
magnitude under the limit. An in-invocation exponential-backoff/sleep loop
inside a cron Worker fights the platform (Workers have wall-clock/CPU limits;
sleeping burns the invocation) and is exactly the framework-cleverness-over-
platform anti-pattern CLAUDE.md §9 warns against. Decision:

- On HTTP **429** (or any non-2xx): **no in-invocation retry**. Log the
  status (never the key), return `degraded` (no persist, freshness not
  advanced). **The next scheduled cron tick is the retry** — combined with
  the ADR 0009 idempotent re-poll this is self-healing and platform-correct.
- Revisit (Cloudflare Queues / Durable Object alarms) only if a future auth
  source polls at a frequency where losing one tick is material. Until then
  "retry" is concrete (the next cron), not an open-ended backoff machine.

### Degraded-semantics unification

This ADR introduces **no new failure semantics**. Missing key, 429/non-2xx,
Zod failure, and an implausible `total` (per-source Cap-2, ADR 0009) all map
onto the single existing `SourceRunResult.degraded` contract: persist
nothing, do not advance `last_synced_at`, do not fire revalidate. The
orchestrator (`index.ts`) is unchanged — auth is just another degrade
trigger. (The orthogonal revalidate-vs-persist coupling is tracked as issue
#11, out of scope here.)

### Attribution

`sources.license` carries the attribution text plus a reference to the
source's terms (same mechanism as the weather source). The UI shows the
attribution with an external link; the future `/quellen` page generates the
formal citation from the `sources` table.

### Data handling for the events table

Recorded here because it is an auth-source-specific rights decision. Eventfrog
exposes both `shortDescription` (brief, multilingual) and `descriptionAsHTML`
(full HTML body). v1 persists **`shortDescription.de` truncated to ≤500
chars, plain text** — a teaser, not full-text/HTML caching. This is the
conservative position and matches the user-approved SOURCE-STRATEGY §c. It is
distinct from ADR 0004's press rule (press tables carry **no** body at all):
Eventfrog is event data on a Public API explicitly offered for
re-publication, not press articles under URG, so a short teaser is
permissible — but the full HTML body is deliberately not stored. Location is
**denormalized** in v1: events reference `locationIds` (a separate
`/public/v1/locations` resource); v1 fills `location_name` from the per-event
`locationAlias.de` when present and leaves coordinates null. Resolving
`locationIds` → coordinates is the documented v1 limit (future issue).

## Consequences

- Every future auth source inherits this pattern by citation (ADR reuse, not
  duplication): source-specific `*_API_KEY`, worker-binding read, missing-key
  → degraded, 429 → degraded + next-cron retry, attribution in
  `sources.license`.
- A **production deploy checklist** obligation is created and recorded here:
  for each auth source, `wrangler secret put <SOURCE>_API_KEY` must be run
  before its first scheduled tick. A standalone deploy runbook is a future
  doc; until it exists this ADR is the authority.
- `apps/ingest/src/env.ts` gains `EVENTFROG_API_KEY: string`; `apps/web` is
  untouched. The orchestrator and the ADR 0009 source mechanic are unchanged.
- The §G1 partner-contract assumption is corrected in the audit trail; future
  gazette/opendata/api-key sources cite ADR 0010 (robots/public-API) and this
  ADR (credential handling) as the now-standard pair.
- Residual risk: a silently rotated/revoked upstream key degrades the source
  until re-provisioned. Mitigated by the loud `degraded` log and the
  unadvanced `last_synced_at` (the `/quellen` freshness signal makes a stale
  source visible); accepted for v1.

## Amendment (2026-05-17, Source 2, post-verification): Source-Native Identifiers

Beyond `external_id` (the primary unique identifier per item), some sources
provide additional source-native identifiers that reflect domain structure
(e.g. Eventfrog's `groupId` linking recurring event occurrences). The
ingestion layer persists these faithfully — they enable presentation-layer
logic (grouping, deduplication, navigation) without forcing the ingest layer
to interpret domain semantics.

Concrete rule: if a source provides a structured identifier that is stable
across related items, persist it as a **nullable text column**; an upstream
"no relation" sentinel is normalised to `NULL` at ingest. Include it in the
canonical `raw_hash` projection so a source-side change triggers an update.
Index it (`(source_id, <id>)`) if presentation queries will group/filter by
it. This avoids reverse-engineering grouping heuristics from text fields
(fragile and not source-correct).

First concrete application — **Eventfrog `groupId`**: verified live + spec
2026-05-17 to be a string ("64-bit int in string format"), single-level, with
the sentinel `"0"` for "not in a group" (147 events / zip 8105+8106 → 4
distinct values; 138 share one series id). Persisted as `events.group_id`
(nullable; `"0"`/empty → `NULL`), added to the canonical `raw_hash`
projection (a one-time idempotent re-upsert backfills existing rows), indexed
`events_source_group_idx (source_id, group_id)`. It drives the
`/veranstaltungen` per-series UI (one card per `group_id`, ungrouped events
shown individually). Schema added via migration `0004` (additive: `ADD COLUMN`
+ `CREATE INDEX`, no change to other tables).
