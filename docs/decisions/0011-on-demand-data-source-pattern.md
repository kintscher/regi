# 11. On-demand data source pattern (no persistence, no cron)

Date: 2026-05-17

## Status

Accepted. Companion to [ADR 0009](0009-ingest-stack.md) (cron ingest stack)
and [ADR 0012](0012-api-key-auth-pattern-for-ingest-sources.md). First (and
defining) instance: the Transport source / `/ov`. ADR-numbering note: written
after ADR 0012 by topic assignment (SOURCE-STRATEGY), not creation order.

## Context

ePublikation, Existenz Weather and Eventfrog establish the **cron ingestion**
pattern: `apps/ingest/src/sources/<name>/`, R2 audit, `raw_hash` idempotency,
`ensureSource`, webhook revalidation, a row per item in Neon.

The Transport API (`transport.opendata.ch/v1/stationboard`, verified
2026-05-17: JSON, no auth) is a fundamentally different class. Live departure
boards are real-time: a prognosis is useless seconds later, has **no archive
value**, and persisting it would only ever serve stale data. Forcing it
through the cron+persist+R2 pattern would be wrong on every axis — it would
store data that must never be read from storage. `CLAUDE.md` §6 already marks
Transport as "on-demand", and the worker has no reason to know it exists.

## Decision

Introduce a **parallel on-demand source pattern**, explicitly distinct from
the cron pattern.

**No worker involvement.** `apps/ingest` does not know Transport exists — no
registry entry, no `run()`, no R2, no `raw_hash`. The cron worker is for
cron+persist sources only; on-demand sources are out of its scope by
definition (this absence is the decision, recorded so it is not "fixed"
later by adding a needless registry stub).

**Code layout — `apps/web/lib/sources/<name>/`.** On-demand source code lives
under the web app, mirroring the worker's per-source directory shape
(`CLAUDE.md` §3 sanctions `lib/sources/<name>/`). For Transport:

```
apps/web/lib/sources/transport/
  schema.ts   # Zod for the stationboard response (the external contract)
  fetch.ts    # fetchStationboard() with the Next data-cache config
  types.ts    # exported UI types
```

This is the on-demand twin of `apps/ingest/src/sources/<name>/`; future
on-demand sources (traffic/Stau, webcams, weather-radar imagery) follow the
same layout. The Zod schema still validates the external contract that only
this layer sees — the page consumes typed data, never raw JSON
(`CLAUDE.md` §4, applied to the on-demand path).

**Fetch mechanic — RSC + Next data cache + client refresh (option A).** The
`/ov` Server Component calls `fetchStationboard()` which does
`fetch(url, { next: { revalidate: 30 } })`. A small Client Component triggers
`router.refresh()` on an interval for the live feel. No Next route handler is
introduced. Rationale:

- `CLAUDE.md` §9 "Web Platform > framework feature": the Next data cache plus
  `router.refresh()` is the platform-native answer; a hand-rolled
  `/api/ov` proxy + client `fetch` poll is strictly more moving parts for no
  gain (the data needs no auth and no shaping the RSC can't do).
- Minimal diff: RSC + one Client Component, versus RSC + Client Component +
  route handler.
- The server-side data cache shields the upstream community API from
  hammering: with `revalidate: 30` the worst case is ~2 upstream requests per
  minute regardless of visitor count.
- `CLAUDE.md` §4's "no `/api/items` for our own data" rule targets *our* DB
  data; this is third-party live data, never persisted — but the
  platform-native answer is the better one here anyway.

**Refresh interval — client 60 s, server `revalidate` 30 s.** The client
`router.refresh()` runs every **60 s**; the server cache revalidates every
**30 s**. 60-over-30 guarantees each client refresh observes data that was
upstream-revalidated within the last 30 s (a full cache cycle always elapses
between refreshes), while halving client→server churn versus a 30 s loop.
This reasoning is restated in a comment in the refresh component so it is not
"tuned" blindly later. Departure prognoses change on a ~minute cadence, so
60 s is not a perceptible staleness for a board.

**Source identity without a worker.** `/quellen` and UI attribution still
need a `sources` row. It is seeded by an idempotent
`packages/db/scripts/seed-static-sources.mts`
(`INSERT … ON CONFLICT (slug) DO NOTHING`), run via `pnpm db:seed:sources`,
for sources that have no worker. `sources.last_synced_at` is left **NULL** —
verified nullable 2026-05-17 (`is_nullable: YES`, no `.notNull()`), so no
migration is needed. NULL is semantically correct here: "never synced,
because never persisted". The `/quellen` page (future) shows on-demand
sources with a "Live, auf Abruf" treatment instead of a last-sync timestamp.

## Consequences

- The cron worker stays narrowly scoped (cron+persist only); on-demand is a
  separate, documented track. Two parallel per-source layouts exist by
  design: `apps/ingest/src/sources/<name>/` (cron) and
  `apps/web/lib/sources/<name>/` (on-demand).
- `/quellen` reads the `sources` table uniformly; `last_synced_at IS NULL`
  is the on-demand marker (no schema flag needed).
- No R2 audit trail for on-demand data. Accepted: the data has no archive or
  legal-traceability value (unlike official notices); there is nothing whose
  provenance must be reconstructable.
- The server data cache is per-Vercel-instance, not globally shared. Accepted
  at v1 scale; a CDN/edge cache can front it later without code change.
- A new static-source seed script is a deliberate, idempotent setup step
  (documented in `README`/setup), not a worker — future on-demand sources add
  one row to it.
- Trade-off vs cron sources: no idempotent re-poll dedupe, no freshness
  signal — irrelevant here because nothing is stored.
