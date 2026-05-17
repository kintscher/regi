# 10. Consuming the documented public Amtsblatt API despite robots.txt

Date: 2026-05-17

## Status

Accepted, **with explicit acknowledgment that this deviates from
`CLAUDE.md` §7** ("jeder Worker-Fetcher liest die robots.txt der Quelle … 
blockierte Pfade nie crawlen"). Companion to
[ADR 0009](0009-ingest-stack.md). Per `CLAUDE.md` §9 a conscious deviation
from the constitution requires an ADR; this is it.

## Context

ePublikation is the highest-priority source (`CLAUDE.md` §6,
`docs/data-sources.md` §A1). Live verification on 2026-05-17 established:

- The readable public API is `https://www.shab.ch/api/v1/publications` —
  JSON, no auth, no key. It is the shared multi-tenant backend of every Swiss
  official gazette; Zürich communal notices are tenant `kabzh`.
- `robots.txt` on **every** gazette host (`www.amtsblattportal.ch`,
  `www.shab.ch`, `amtsblatt.zh.ch`) is `User-agent: * / Disallow: /`. API
  responses also carry `X-Robots-Tag: noindex`.

Read literally, `CLAUDE.md` §7 plus the `docs/data-sources.md` legal section
("alle robots.txt der Quellen respektieren") would forbid using this source at
all — which would remove the project's single most important data source. The
question is whether a blanket `Disallow: /` on these hosts actually governs
consumption of the purpose-built REST API.

## Decision

regi consumes the documented public `www.shab.ch/api/v1` API for ePublikation
(and future gazette-backed sources). This rests on four pillars:

1. **robots.txt governs crawlers/indexers, not API clients.** The Robots
   Exclusion Standard scopes automated *retrieval and indexing of a site's
   web content* by crawlers. `X-Robots-Tag: noindex` is a search-engine
   indexing directive. regi does not crawl the site, does not follow links,
   does not index the gazette UI, and does not republish under its own search
   surface beyond free official content. The directive and the activity are
   technically and intentionally decoupled — the operator ships a separate,
   versioned REST API precisely so integrators do not scrape the HTML app.

2. **The API exists for exactly this use.** It is operated by SECO (carrier:
   Schweizerischer Gemeindeverband) as a documented import/export REST
   interface for third-party integration, and is used productively by third
   parties today (Tamedia / zuonline.ch, the Grossenbacher project) to
   re-publish municipal notices. Programmatic consumption is the API's stated
   purpose, not a circumvention of it.

3. **No copyright conflict.** Official notices are free under URG Art. 5
   (`docs/data-sources.md`, legal section; `CLAUDE.md` §7). There is no
   sui-generis database right in Switzerland; UWG Art. 5 lit. c targets
   systematic exploitation of *commercial* databases (local.ch, homegate),
   not a public-law gazette of freely reusable official information.
   Attribution is nonetheless mandatory and provided.

4. **Active, proportionate risk mitigation.** The deviation is bounded by
   concrete safeguards (below), so the conduct is demonstrably *lauter* even
   under the robots.txt-as-fairness-indicium reasoning of the Swiss
   aggregator case law (Tamedia v. NewsAggregator) cited in
   `docs/data-sources.md`.

### Mitigations (binding)

- **Identifying User-Agent** on every request: the canonical
  `regi/1.0 (+https://regi.ch; contact: yannik@kintscher.ai)` (`CLAUDE.md`
  §7) — regi is never anonymous and is always reachable.
- **Low, fixed frequency**: the documented 30-minute cron (`CLAUDE.md` §6),
  small page sizes, narrow date-windowed and tenant/canton-scoped queries —
  no bulk sweep of the 2.7M-row global corpus.
- **Conditional GET**: honour `ETag` (present on responses) to avoid
  refetching unchanged pages.
- **Audit trail**: every raw response retained 12 months in R2
  (`regi-raw`), hash + source + timestamp in the DB (`CLAUDE.md` §7) — full
  traceability of what was fetched and when.
- **Attribution & transparency**: the auto-generated `/quellen` page lists
  ePublikation with licence and last sync; source attribution is shown in
  the UI.
- **revDSG**: detail pages of notices with personal reference get
  `<meta name="robots" content="noindex">` (`CLAUDE.md` §7); §11.6 v1
  additionally excludes debt-enforcement and bankruptcy notices entirely
  (ADR 0009 / plan §o), narrowing personal-data exposure further.
- **Immediate cessation on formal objection**: a documented contactable
  operator (the UA mail) plus a commitment to stop or adjust on any formal
  complaint from SECO or a data subject.

## Consequences

- The project keeps its single most important data source instead of losing
  it to a literal reading of §7.
- `CLAUDE.md` §7's "robots.txt respektieren" is now qualified: it governs
  *crawling*; documented public APIs are consumed under the mitigation set
  above. The constitution text is not edited here (ADRs, not silent rewrites,
  carry deviations); future sources cite this ADR when the same situation
  recurs (gazette-backed sources, opendata APIs with blanket host robots.txt).
- A residual non-zero risk remains that an operator interprets `Disallow: /`
  as covering API access; the mitigation set — chiefly the identifying UA and
  the cease-on-objection commitment — is the accepted control for it.
- The fairness posture is documented and reproducible from the audit trail if
  ever challenged.
