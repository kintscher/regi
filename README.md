# regi

Alles Wichtige aus deiner Gemeinde Regensdorf.

regi is a hyperlocal information site for Regensdorf, a 19,000-resident municipality in canton Zurich, Switzerland. It pulls official announcements, weather, transit, events, and waste schedules from public Swiss data sources and renders them in a single typographic system.

## What it shows

- Official municipal announcements (ePublikation, regensdorf.ch)
- Real-time train and bus departures (Bahnhof Regensdorf-Watt)
- Current weather (Station Zürich-Affoltern, MeteoSchweiz)
- Upcoming events (Eventfrog, filtered by PLZ)
- Waste collection schedules (special dates + recurring rules)
- Municipal news and press releases

## Why it exists

The municipality, the canton, MeteoSchweiz, SBB, and Eventfrog all publish public data. regi pulls it together for residents — one place to check what's happening today instead of six.

## Tech stack

- **Next.js 16** App Router with React Server Components
- **React 19** + **Tailwind v4** (CSS-first, no config file)
- **Drizzle ORM** + **Neon Postgres** (Frankfurt region, HTTP driver in RSC)
- **Cloudflare Workers** (cron) + **R2** (raw-response audit trail) — workers run scheduled fetches at the edge for near-zero cost
- **pnpm workspaces** (monorepo: `apps/web`, `apps/ingest`, `packages/db`)
- **TypeScript strict** with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- **Biome** for formatting and linting (no ESLint, no Prettier)

## Architecture

regi follows three core ingestion patterns: cron-based persistence (`apps/ingest`), on-demand fetch with client refresh (`apps/web/lib/sources/transport`), and embedded-JSON scraping for sites without APIs (regensdorf.ch). Each major decision is documented in [`docs/decisions/`](./docs/decisions) — 14 ADRs covering the monorepo migration, schema choices, authentication patterns, scraping rationale, and the single-column dashboard layout.

```
regi/
├── apps/
│   ├── web/         Next.js frontend
│   └── ingest/      Cloudflare Worker (cron + on-demand sources)
├── packages/
│   └── db/          Drizzle schema, shared by web and ingest
└── docs/
    ├── decisions/   Architecture Decision Records
    ├── data-sources.md
    └── design-system.md
```

## Getting started

```bash
pnpm install
cp .env.example .env.local         # fill in values
ln -s ../../.env.local apps/web/.env.local   # once, if not already linked
pnpm db:migrate                    # apply migrations to your Neon dev branch
pnpm web dev                       # start Next dev server on :3000
```

Root scripts: `pnpm typecheck` · `pnpm lint` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:studio` · `pnpm db:seed`. A versioned pre-commit hook (`.githooks/`, wired via `core.hooksPath`) enforces typecheck + Biome.

For the ingest worker, see [`apps/ingest/`](./apps/ingest) (run locally with `wrangler dev`). All required environment variables are documented in [`.env.example`](./.env.example). Binding standards live in [`CLAUDE.md`](./CLAUDE.md).

## Project status

v1 — local development, not yet publicly deployed. All six data sources (ePublikation, MeteoSchweiz, Eventfrog, OpenTransport, regensdorf.ch news, regensdorf.ch waste) are functional locally; production deployment to Vercel + Cloudflare Workers is the next milestone.

## License

[MIT](./LICENSE). Aggregated data remains the property of its respective publishers; see `/quellen` for full attribution.

## Acknowledgments

- [ePublikation.ch](https://www.amtsblattportal.ch/) — SHAB / cantonal & municipal official publications (SECO)
- [Gemeinde Regensdorf](https://www.regensdorf.ch/) — municipal news and waste calendar
- [MeteoSchweiz](https://www.meteoschweiz.admin.ch/) via [api.existenz.ch](https://api.existenz.ch/) — weather
- [Eventfrog](https://eventfrog.ch/) — public event calendar
- [OpenTransport](https://transport.opendata.ch/) — public transit timetables

## Contact

Yannik Kintscher · [yannik@kintscher.ai](mailto:yannik@kintscher.ai) · [github.com/kintscher](https://github.com/kintscher) · [kintscher.ai](https://kintscher.ai)
