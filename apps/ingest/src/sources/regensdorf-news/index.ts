import { publications, sources } from "@regi/db/schema";
import type { Env } from "../../env";
import { getDb } from "../../lib/db";
import { putRawAudit } from "../../lib/r2";
import type { SourceRunResult } from "../types";
import { PLAUSI_NEWS_MAX } from "./constants";
import { mapRow, type NewsCandidate, parseNewsIsland, validateRow } from "./parse";

const PAGE_URL = "https://www.regensdorf.ch/aktuellesinformationen";
const SLUG = "regensdorf-news";
const REVALIDATE_TAG = "source:regensdorf-news";

// Identity row for the auto-generated /quellen page. regensdorf.ch is the
// municipal primary source; its notices are amtliche Werke, free under URG
// Art. 5 (ADR 0013 — empty robots.txt, identifying UA, R2 audit; the ADR 0010
// mitigation set applies by analogy). License string is operator-fixed.
const SOURCE = {
  name: "Gemeinde Regensdorf",
  slug: SLUG,
  url: PAGE_URL,
  license: "Gemeinde Regensdorf — primärquelle, URG Art. 5 (amtliches Werk)",
} as const;

const DEGRADED: SourceRunResult = {
  fetched: 0,
  persisted: 0,
  unchanged: 0,
  skipped: 0,
  filteredOut: 0,
  degraded: true,
};

export async function runRegensdorfNews(env: Env): Promise<SourceRunResult> {
  const res = await fetch(PAGE_URL, { headers: { "user-agent": env.REGI_USER_AGENT } });
  if (!res.ok) {
    // Surfaces to the orchestrator's per-source try/catch — one bad source
    // never aborts the cron run (CLAUDE.md §4).
    throw new Error(`regensdorf-news: HTTP ${res.status}`);
  }
  const rawBody = await res.text();

  // Byte-faithful audit of the fetched page (ADR 0013 keeps the ADR 0009
  // audit unchanged). Written before parsing so a parse-time drift is still
  // reconstructable from R2 12 months on.
  const auditKey = await putRawAudit(env.RAW, SLUG, rawBody);

  const rows = parseNewsIsland(rawBody);
  // Island absent / unparseable → loud degrade, not a crash (ADR 0013).
  if (rows === null) {
    console.error(`regensdorf-news degraded: #informationList island absent/unparseable`);
    return DEGRADED;
  }
  const fetched = rows.length;
  // Empty island or contract-drift inflation → degrade (ADR 0013 / Cap-2,
  // ADR 0009): persist nothing, do not advance freshness, /quellen goes stale.
  if (fetched === 0) {
    console.error(`regensdorf-news degraded: island present but empty (audit=${auditKey})`);
    return DEGRADED;
  }
  if (fetched > PLAUSI_NEWS_MAX) {
    console.error(
      `regensdorf-news degraded: rows=${fetched} > PLAUSI_NEWS_MAX=${PLAUSI_NEWS_MAX}; no persist`,
    );
    return DEGRADED;
  }

  let skipped = 0;
  const candidates: NewsCandidate[] = [];
  for (const raw of rows) {
    const row = validateRow(raw); // strict per-item (ADR 0013)
    if (!row) {
      skipped++;
      continue;
    }
    const cand = mapRow(row);
    if (!cand) {
      skipped++;
      continue;
    }
    candidates.push(cand);
  }

  // Every row failing = systematic contract drift, not isolated bad items:
  // degrade rather than silently persisting nothing as a "clean" run.
  if (candidates.length === 0) {
    console.error(
      `regensdorf-news degraded: ${fetched} rows, 0 valid (systematic drift; audit=${auditKey})`,
    );
    return DEGRADED;
  }

  const db = getDb(env.DATABASE_URL);

  // Idempotent identity upsert (ADR 0009). last_synced_at is NOT set here —
  // only after a clean persist below, so a degraded run never advances the
  // freshness signal.
  const ensured = await db
    .insert(sources)
    .values(SOURCE)
    .onConflictDoUpdate({
      target: sources.slug,
      set: { name: SOURCE.name, url: SOURCE.url, license: SOURCE.license },
    })
    .returning({ id: sources.id });
  const sourceId = ensured[0]?.id;
  if (!sourceId) throw new Error("regensdorf-news: ensureSource returned no id");

  // Pre-fetch this source's known hashes; decide insert/update/skip in memory
  // (volume tiny). Unchanged rows are never written → no revalidate churn
  // (ADR 0009 "Hash-1").
  const existingRows = await db.query.publications.findMany({
    columns: { externalId: true, rawHash: true },
    where: (t, { eq }) => eq(t.sourceId, sourceId),
  });
  const known = new Map(existingRows.map((r) => [r.externalId, r.rawHash]));

  let persisted = 0;
  let unchanged = 0;
  for (const c of candidates) {
    if (known.get(c.externalId) === c.rawHash) {
      unchanged++;
      continue;
    }
    await db
      .insert(publications)
      .values({
        sourceId,
        externalId: c.externalId,
        title: c.title,
        body: null, // v1: title + metadata only (ADR 0013; mirrors epublikation)
        category: c.category,
        url: c.url,
        publishedAt: c.publishedAt,
        rawHash: c.rawHash,
      })
      .onConflictDoUpdate({
        target: [publications.sourceId, publications.externalId],
        set: {
          title: c.title,
          body: null,
          category: c.category,
          url: c.url,
          publishedAt: c.publishedAt,
          rawHash: c.rawHash,
          updatedAt: new Date(),
        },
      });
    persisted++;
  }

  // Advance freshness only on a clean run (slug-upsert avoids a where-operator
  // import; the worker never imports the @regi/db index).
  await db
    .insert(sources)
    .values({ ...SOURCE, lastSyncedAt: new Date() })
    .onConflictDoUpdate({ target: sources.slug, set: { lastSyncedAt: new Date() } });

  console.log(
    `regensdorf-news: fetched=${fetched} persisted=${persisted} unchanged=${unchanged} ` +
      `skipped=${skipped} audit=${auditKey}`,
  );

  return { fetched, persisted, unchanged, skipped, filteredOut: 0, degraded: false };
}

export { REVALIDATE_TAG, SLUG };
