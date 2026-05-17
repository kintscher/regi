import { pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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
 * Official notices (ePublikation / Amtsblatt). `body` is kept on purpose:
 * official content is free to reproduce under URG Art. 5.
 *
 * Press articles are deliberately NOT modelled here. They will get a separate
 * table with no `body` column (title + snippet + link + date only) — a
 * structural guarantee that press full text is never cached (CLAUDE.md §7).
 * See ADR 0004.
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
