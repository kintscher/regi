# 13. Embedded-JSON scraping pattern (regensdorf.ch / i-web CMS)

Date: 2026-05-18

## Status

Accepted. Companion to [ADR 0009](0009-ingest-stack.md) (cron ingest stack,
reused unchanged) and [ADR 0010](0010-public-api-vs-robots.md) (robots/legal
posture for non-API retrieval). First instances: Source 5
`regensdorf-news` (`/aktuellesinformationen`) and Source 6 `regensdorf-waste`
(`/abfalldaten`). Records the first **scraping** source class — every prior
source (ePublikation, Existenz Weather, Eventfrog, Transport) is a REST/JSON
API.

## Context

ePublikation/Eventfrog/Existenz are documented JSON APIs; ADR 0009 fixed the
cron worker mechanic for them. regensdorf.ch is the municipal primary source
and has **no feed and no API** — verified live 2026-05-18 (identifying UA
`regi/1.0 (+https://regi.ch; contact: yannik@kintscher.ai)`):

- Every feed variant 404s: `.rss`, `.atom`, `.json`, `.ics`, `/_rtr/*.rss`,
  `/rss`, `/news.rss`. A real `sitemap.xml` exists but only as a URL list (no
  `lastmod`, no news namespace) — useless for change detection.
- `robots.txt` → HTTP 200, **`content-length: 0`**, empty body (ETag
  `d41d8cd98f00b204e9800998ecf8427e` = MD5 of the empty string). An empty
  robots.txt carries **no `Disallow`** — nothing is forbidden. This is the
  inverse of the gazette hosts in ADR 0010 (`Disallow: /`); the
  `docs/data-sources.md` §A4 instruction "robots.txt vor Scraping prüfen" is
  satisfied, and the Tamedia-v-NewsAggregator fairness concern in
  `docs/data-sources.md` does not arise (no exclusion to disregard, primary
  source, official information free under URG Art. 5 — distinct from the
  third-party-press aggregation blocked in issue #15).
- No `X-Robots-Tag`, no `<meta name="robots">`: content is indexable.

The decisive structural finding: regensdorf.ch (i-web/innosolv CMS, header
`x-webapp`) does **not** require DOM scraping. The list data is rendered
server-side as a **JSON island embedded in an HTML data-attribute**:

```html
<table id="informationList" data-webpack-module="datatables"
       data-entity-type="information"
       data-entities="{&quot;data&quot;:[ … full dataset … ]}">
```

`data-entities` is the complete current dataset as HTML-entity-encoded JSON,
present in the raw markup without JavaScript or cookies (extracted with plain
`curl`). It is the hydration payload the page's DataTables client reads. A
single GET of the page yields every item as structured JSON, each with a
stable source-native numeric id in its detail href (`/_rte/information/<id>`,
`/_rte/anlass/<id>`). This is categorically more robust than parsing rendered
DOM: it is a structured contract, closer to an undocumented endpoint than to
scraping.

## Decision

Introduce the **embedded-JSON scraping pattern**: a cron source whose
"external API" is a JSON document a server embeds in an HTML data-attribute.
It reuses the ADR 0009 cron mechanic wholesale (per-source directory under
`apps/ingest/src/sources/<name>/`, R2 raw audit, canonical `raw_hash`,
`ensureSource`, degraded semantics, per-source Cap-2) — only the *fetch+parse*
stage differs from an API source.

**Extraction (binding).**

1. GET the listing page once with the canonical identifying UA.
2. Extract the target island by **stable id + `data-entity-type`**
   (`#informationList` / `#icmsTable-abfallsammlung` / `#regulaeresammlungen`),
   never by positional/structural HTML assumptions.
3. HTML-entity-decode the attribute and `JSON.parse` it.
4. Validate the parsed JSON with **Zod** — exactly as an API response is
   validated (ADR 0009): the parsed island *is* the external contract; the
   page consumes typed data, never raw HTML (`CLAUDE.md` §4). The Zod schema
   lives at `sources/<name>/schema.ts`.
5. Per-item residual HTML (e.g. the `<a href="/_rte/information/<id>">title</a>`
   inside a `name` field, date wrapped in responsive `<span>`s) is reduced to
   its data by a **single documented narrow regex per field**, not a DOM
   parser — the value extracted is the stable datum (id, title text, date
   string), and that extraction is unit-tested.

**Robustness rationale.** A CMS's hydration contract (the shape of the JSON it
serializes for its own client widget) is materially more stable than its
visual layout/CSS: the markup around the island can be re-themed without
touching `data-entities`, whereas a DOM scraper breaks on any layout change.
Binding to `data-entity-type` + field names tracks the data contract, not the
presentation.

**Mitigations against markup/contract drift (binding).**

- **Zod `strict`, never `.passthrough()`**: an added/renamed island field
  fails validation loudly per item and is skipped+counted (ADR 0009
  degraded-item semantics) rather than silently mis-mapped.
- **Per-source Cap-2 plausibility bound** (ADR 0009): `PLAUSI_NEWS_MAX = 500`
  (Source 5; empirically ~61 over 10 months, peak 19/mo) and
  `PLAUSI_WASTE_MAX = 300` (Source 6; 20 special dates over 7 months). The
  global Cap-1 (5000) is unchanged. A structural change that makes the island
  absent/empty yields zero items → the run persists nothing and does not
  advance `last_synced_at` (the `/quellen` freshness signal surfaces the
  staleness).
- **Island-absence is a degrade, not a crash**: a missing/zero island returns
  `degraded` (ADR 0009 / ADR 0012 unified degraded contract), never throws the
  cron run.
- **Raw audit unchanged**: the byte-faithful fetched HTML page is written to
  R2 per ADR 0009, so any contract change is reconstructable from the audit
  trail 12 months back.

**Application criteria.** Use this pattern when **all** hold: (a) the source
has no feed/API; (b) the data is present in the **server-rendered** markup as
a structured blob in a `data-*` attribute (or an inline `application/json` /
`<script type="application/ld+json">` island) — i.e. extractable without a
headless browser; (c) items carry a stable source-native id usable as
`external_id`.

**Non-application (explicit).** Do **not** use — and do not reach for a
headless browser to force it — when: the data is fetched only by client-side
JS after load (no island in the server HTML); or extraction would require
walking rendered DOM/CSS selectors for the *content itself* (BeautifulSoup /
Cheerio-style structural scraping). Those are out of scope for v1; such a
source is either deferred or pursued via a different documented mechanism, with
its own ADR. This bound keeps "scraping" in regi narrow and contract-based, not
open-ended DOM mining.

**Schema reuse (Fork 2).** Source 5 reuses the existing `publications` table
rather than adding a parallel one — the governing rule is the dedicated
*Schema reuse over table inflation* section below.

## Schema reuse over table inflation (pattern obligation)

This is a binding pattern, not a one-off Fork-2 note: it governs every future
source, embedded-JSON or API.

Schema reuse over table inflation is the default pattern whenever the data
shape is identical or near-identical. Sources are kept apart by `source_id`.
When a new source introduces an additional field (e.g. `category` for
source-specific classification), that field is added **additively** to the
existing table, **nullable**. Existing sources do not populate it (NULL) and
stay unchanged. That is the right granularity: no n:m tables for rarely-used
fields, no table duplication for congruent shapes.

Concrete instance: regensdorf-news extends `publications` with `category` +
`url` (migration `0005`, additive `ADD COLUMN`, both nullable, with SQL
`COMMENT ON COLUMN` + parallel Drizzle doc-comments). ePublikation rows remain
with `category = NULL` and `url = NULL`, entirely unchanged; the
`publications` doc-comment is widened to state the table now spans multiple
authority sources (ePublikation + regensdorf-news, further sources expected;
separation via `source_id`; source-specific fields additive and nullable).
`CLAUDE.md` §10 (no schema-by-source proliferation without need) is the
constitutional anchor for this.

The boundary: schema divergence into a **new** table is reserved for
genuinely different data, not different provenance of the same shape.
Source 6's `waste_collections` (dated collection events, no `body`,
route/Abfuhrkreis structure) is the legitimate divergence case — its shape is
not near-congruent with `publications`, so reuse would be the wrong call
there. "Near-identical shape → reuse + nullable column"; "different data
model → new table". Provenance alone never justifies a new table.

## Consequences

- regi gains a contract-based scraping class without a headless browser and
  without DOM mining; the ADR 0009 cron mechanic is reused unchanged (one
  directory + one registry line + an island-extract/Zod stage).
- Binding to the hydration contract trades one risk (CMS changes its embedded
  JSON shape) for a strictly smaller one than DOM scraping (CMS re-themes its
  layout) — and the former degrades loudly via strict Zod + Cap-2 rather than
  corrupting rows.
- The empty-robots.txt finding is recorded so future regensdorf.ch sources do
  not re-litigate the legal posture: primary source, official information free
  under URG Art. 5, no exclusion to honour, identifying UA + low cron
  frequency + R2 audit (the ADR 0010 mitigation set applies by analogy).
- The non-application clause prevents this ADR from being read as a license
  for arbitrary scraping; client-rendered or DOM-only sources require their
  own decision.
- Residual risk: a future i-web release could move from server-embedded
  `data-entities` to client-fetched data. Mitigated by the loud-degrade design
  (zero items → no persist, stale `/quellen` signal) and the R2 audit; the
  response is a new ADR for that source, not silent DOM-scraper bolt-on.
