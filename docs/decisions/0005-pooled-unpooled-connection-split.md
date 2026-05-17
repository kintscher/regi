# 5. Split pooled and unpooled Postgres connections into two env vars

Date: 2026-05-17

## Status

Accepted

## Context

Neon exposes two connection endpoints per branch:

- a **pooled** endpoint (PgBouncer, host contains `-pooler`), suited to many
  short-lived connections from serverless / edge / RSC, consumed via the Neon
  HTTP driver;
- a **direct (unpooled)** endpoint that speaks the full Postgres wire protocol.

The application runtime (React Server Components, serverless functions) benefits
from the pooled endpoint. Drizzle Kit migrations require the direct endpoint:
schema migrations need session-level features and the raw wire protocol that a
transaction pooler does not expose. Driving both off one connection string —
or switching at runtime — produces subtle, hard-to-debug failures (migrations
that hang or partially apply, advisory locks that misbehave).

## Decision

Use two distinct environment variables, no runtime switch:

- `DATABASE_URL` — pooled endpoint. The application reads only this.
- `DATABASE_URL_UNPOOLED` — direct endpoint. Drizzle Kit migrations read only
  this.

Each Neon branch (development, production) has its own pair. Local development
uses the dev-branch pair in `.env.local` (git-ignored). The production pair is
configured in Vercel Project Settings, never in any committed file. `.env.example`
documents the variable shape with placeholders only.

## Consequences

- Clear mental model: one variable per concern, selected by which tool reads it
  — no conditional logic deciding pooled vs direct at runtime.
- Every environment must provision two strings instead of one; the Vercel env
  configuration is likewise split (dev/preview vs production pairs).
- Migrations and app never contend on the same pooled path.
- Drizzle config (added at §11.3) will reference `DATABASE_URL_UNPOOLED`
  explicitly; the app DB client will reference `DATABASE_URL`. Recorded so the
  split is not accidentally collapsed later.
