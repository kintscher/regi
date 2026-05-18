import { index, integer, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

/**
 * One row per external data source (ePublikation, Eventfrog, …). Drives the
 * auto-generated /quellen page: name, url, license and last successful sync.
 */
export const sources = pgTable("sources", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  url: text("url").notNull(),
  license: text("license").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Official and authority notices from multiple sources — currently
 * ePublikation (shab.ch / SECO API) and regensdorf-news (regensdorf.ch
 * /aktuellesinformationen, ADR 0013). Adding further authority sources of the
 * same shape is explicitly expected; rows stay source-faithful and sources are
 * kept apart via `source_id` (no cross-source dedup at ingest — see the
 * deferred dedup-evaluation issue). Source-specific fields are added
 * additively and nullable (ADR 0013 schema-reuse rule): a source that needs a
 * field adds it; existing sources leave it NULL and stay unchanged. `body` is
 * kept on purpose: official content is free to reproduce under URG Art. 5
 * (v1 leaves it NULL for both sources; full body is a follow-up).
 *
 * Press articles are deliberately NOT modelled here. They will get a separate
 * table with no `body` column (title + snippet + link + date only) — a
 * structural guarantee that press full text is never cached (CLAUDE.md §7).
 * See ADR 0004. (regensdorf-news `pressemitteilungen` is a *source category*
 * of municipal communications, not press-industry articles — it belongs here.)
 *
 * (source_id, external_id) is unique so ingestion can upsert idempotently.
 */
export const publications = pgTable(
  "publications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => ulid()),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "restrict" }),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    // Source-specific categorization (e.g. regensdorf-news: news vs
    // pressemitteilungen). NULL for sources without categorization
    // (ePublikation rows stay NULL). ADR 0013 schema-reuse rule.
    category: text("category"),
    // Per-item detail URL. NULL means fallback to source.url (homepage) for
    // display (ePublikation rows stay NULL; see /amtliches link fallback).
    url: text("url"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
    rawHash: text("raw_hash").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("publications_source_external_uniq").on(t.sourceId, t.externalId)],
);

/**
 * Weather observations from the Existenz SMN proxy (MeteoSwiss SwissMetNet).
 * One row per station per 10-minute reading; the worker polls every 15 min and
 * upserts idempotently on (station_code, observed_at).
 *
 * Each measurement column is nullable on purpose: a single missing parameter in
 * the upstream payload must not drop the row — it records whatever arrived.
 * No `body`/text content: this is structured numeric data, not a notice.
 */
export const weatherObservations = pgTable(
  "weather_observations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => ulid()),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "restrict" }),
    stationCode: text("station_code").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    tempC: real("temp_c"),
    rhPct: real("rh_pct"),
    windKmh: real("wind_kmh"),
    gustKmh: real("gust_kmh"),
    precipMm: real("precip_mm"),
    pressureHpa: real("pressure_hpa"),
    rawHash: text("raw_hash").notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("weather_obs_station_observed_uniq").on(t.stationCode, t.observedAt)],
);

/**
 * Public events from the Eventfrog Public API. `description` holds a short
 * teaser (shortDescription.de, ≤500 chars, app-enforced) — NOT the full HTML
 * body: Eventfrog is event data offered for re-publication, so a teaser is
 * permissible, but full-text/HTML is deliberately not cached (ADR 0012;
 * contrast ADR 0004's no-body press rule). Location is denormalized in v1:
 * Eventfrog references locations by id (a separate resource), so location_name
 * comes from the per-event alias when present and coordinates stay null until
 * a later locationIds-resolve (ADR 0012, v1 limit).
 *
 * (source_id, external_id) is unique so ingestion can upsert idempotently.
 */
export const events = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => ulid()),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "restrict" }),
    externalId: text("external_id").notNull(),
    // Source-native group identifier (Eventfrog groupId): recurring
    // occurrences of the same event share it. Nullable — the upstream "0"
    // sentinel ("not in a group") is normalised to NULL at ingest, which is
    // semantically correct for "no grouping relation" (ADR 0012 amendment,
    // "Source-Native Identifiers"). Drives the /veranstaltungen per-series UI.
    groupId: text("group_id"),
    title: text("title").notNull(),
    description: text("description"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    locationName: text("location_name"),
    locationLat: real("location_lat"),
    locationLon: real("location_lon"),
    url: text("url").notNull(),
    organizerName: text("organizer_name"),
    rubricId: integer("rubric_id"),
    imageUrl: text("image_url"),
    rawHash: text("raw_hash").notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("events_source_external_uniq").on(t.sourceId, t.externalId),
    // /veranstaltungen groups by series; index the grouping key up front
    // rather than as a later perf fix.
    index("events_source_group_idx").on(t.sourceId, t.groupId),
  ],
);
