# regi

Automatisierte Aggregator-Plattform für die Gemeinde Regensdorf ZH
(inkl. Watt und Adlikon). Verbindliche Standards: [`CLAUDE.md`](./CLAUDE.md).
Architektur-Entscheidungen: [`docs/decisions/`](./docs/decisions).

## Monorepo

pnpm-Workspace (`pnpm-workspace.yaml`):

| Pfad          | Paket          | Zweck                                     |
|---------------|----------------|-------------------------------------------|
| `apps/web`    | `@regi/web`    | Next.js Frontend (Vercel)                 |
| `apps/ingest` | `@regi/ingest` | Cloudflare Workers Datenbezug (geplant)   |
| `packages/db` | `@regi/db`     | Geteiltes Drizzle-Schema + Neon-Client    |

## Entwicklung

```bash
pnpm install
cp .env.example .env.local        # Neon-Connection-Strings eintragen
ln -s ../../.env.local apps/web/.env.local   # einmalig, falls noch nicht vorhanden
pnpm web dev                      # http://localhost:3000
```

Root-Scripts: `pnpm typecheck` · `pnpm lint` · `pnpm db:generate` ·
`pnpm db:migrate` · `pnpm db:studio` · `pnpm db:seed`.

Der versionierte Pre-Commit-Hook (`.githooks/`, via `core.hooksPath`)
erzwingt typecheck + Biome.
