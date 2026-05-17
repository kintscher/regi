# 4. Schema changes via drizzle-kit generate/migrate, never db push

Date: 2026-05-17

## Status

Accepted

## Context

Drizzle Kit offers two ways to evolve the database: `drizzle-kit push`, which
diffs the schema and mutates the live database directly, and the
`generate` → `migrate` pair, which emits versioned SQL migration files that are
applied in order and tracked in a journal table.

`push` is convenient for throwaway prototyping but leaves no artifact: there is
no reviewable diff, no ordered history, and the production state depends on
whoever last ran `push` against it. For a production, legally-accountable
aggregator this is unacceptable — `CLAUDE.md` requires migrations, an audit
trail, and reproducibility.

## Decision

All schema changes go through `pnpm db:generate` (writes SQL to
`packages/db/migrations/` plus `meta/`) followed by `pnpm db:migrate`.
`drizzle-kit push` is never used against any branch. `db:studio` is read/debug
only.

Migrations run on the **unpooled** connection (`DATABASE_URL_UNPOOLED`), see
ADR 0005. The journal lives in a separate `drizzle` schema
(`drizzle.__drizzle_migrations`), keeping `public` to application tables only.

The initial skeleton is deliberately minimal — only `sources` and
`publications`. `press_items`, `events`, `waste_dates` are added with the
worker source that first needs them, to avoid empty tables without consumers.

Structural press/official separation: `publications` keeps a `body` column
because official content is free under URG Art. 5. Press articles will get a
separate table with **no** `body` column (title + snippet + link + date only),
so press full text physically cannot be cached (`CLAUDE.md` §7).

## Consequences

- Every schema change is a reviewable SQL diff in git with an ordered history;
  database state is reproducible from zero on any branch.
- Slightly more friction than `push` (a generate step, a committed file).
  Accepted — that friction is the point.
- Generated migration files are committed verbatim and never hand-edited once
  applied; corrections are new migrations.
- `ulid` is a runtime `dependency` (not `devDependency`), because
  `schema.ts` calls `ulid()` in `$defaultFn` at insert time and is imported by
  RSC; a devDependency would break the Vercel production build.
