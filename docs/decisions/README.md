# Architecture Decision Records

Each ADR captures one architectural decision: the context, the choice, and
the consequences. New ADRs are numbered sequentially; superseded ADRs stay
in place so the history is readable. Format follows Michael Nygard's
template.

| #    | Title                                                                                                      | Status                              |
|------|------------------------------------------------------------------------------------------------------------|-------------------------------------|
| [0001](./0001-repository-layout.md) | Repository layout: separate `regi-web` and `regi-ingest` as sibling directories            | Superseded by 0007                  |
| [0002](./0002-nextjs-version.md) | Pin Next.js to the current stable major (16)                                                  | Accepted                            |
| [0003](./0003-defer-design-system.md) | Defer the design system until after pipeline validation                                  | Accepted                            |
| [0004](./0004-migrations-not-db-push.md) | Schema changes via drizzle-kit generate/migrate, never db push                        | Accepted                            |
| [0005](./0005-pooled-unpooled-connection-split.md) | Split pooled and unpooled Postgres connections into two env vars            | Accepted                            |
| [0006](./0006-light-mode-only-v1.md) | Ship light mode only in v1, with a prepared dark-mode stub                                | Accepted                            |
| [0007](./0007-monorepo-pnpm-workspaces.md) | Monorepo with pnpm workspaces (supersedes ADR 0001)                                 | Accepted, supersedes 0001           |
| [0008](./0008-shared-db-package.md) | Shared `@regi/db` package                                                                  | Accepted                            |
| [0009](./0009-ingest-stack.md) | `apps/ingest` stack & worker architecture                                                       | Accepted                            |
| [0010](./0010-public-api-vs-robots.md) | Consuming the documented public Amtsblatt API despite robots.txt                        | Accepted (deviates from §7 default) |
| [0011](./0011-on-demand-data-source-pattern.md) | On-demand data source pattern (no persistence, no cron)                        | Accepted                            |
| [0012](./0012-api-key-auth-pattern-for-ingest-sources.md) | API-key authentication pattern for ingest sources (Eventfrog)        | Accepted                            |
| [0013](./0013-embedded-json-scraping-pattern.md) | Embedded-JSON scraping pattern (regensdorf.ch / i-web CMS)                    | Accepted                            |
| [0014](./0014-dashboard-single-column-multi-section.md) | Dashboard `/` as a single-column multi-section gazette page            | Accepted                            |

## Writing a new ADR

1. Copy the next number. Name the file `NNNN-kebab-slug.md`.
2. Sections: `# N. Title` · `## Status` · `## Context` · `## Decision` · `## Consequences`.
3. When an ADR supersedes another, update the older ADR's status line and link both ways.
4. Append the entry to the table above.
