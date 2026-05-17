import { createHash } from "node:crypto";
import { publications, sources } from "@regi/db/schema";
import type { Env } from "../../env";
import { getDb } from "../../lib/db";
import { putRawAudit } from "../../lib/r2";
import type { SourceRunResult } from "../types";
import { MAX_PAGES, PAGE_SIZE, PLAUSI_TOTAL_MAX, WINDOW_DAYS } from "./constants";
import { type EpublicationMeta, listEnvelope, publicationListItem } from "./schema";

const API = "https://www.shab.ch/api/v1/publications";
const SLUG = "epublikation";
const REVALIDATE_TAG = "source:epublikation";

// Identity row for the auto-generated /quellen page. URG Art. 5 free
// (ADR 0010). Slug `epublikation`; the dev mock fixture stays separate
// (`epublikation-test`).
const SOURCE = {
  name: "ePublikation",
  slug: SLUG,
  url: "https://www.shab.ch",
  license: "Public Domain (URG Art. 5)",
} as const;

type Candidate = {
  externalId: string;
  title: string;
  publishedAt: Date;
  rawHash: string;
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Canonical raw_hash: SHA-256 over a fixed-order projection of the *stable*
 * fields the row derives from — never the whole response (volatile request
 * ids / pagination echo). `updateDate` is included so a genuine upstream
 * correction flips the hash and re-upserts (ADR 0009 "Hash-1").
 */
function canonicalRawHash(m: EpublicationMeta): string {
  const canonical = JSON.stringify([
    m.id,
    m.title.de,
    m.publicationDate,
    m.updateDate,
    m.rubric,
    m.subRubric,
    m.registrationOffice ? m.registrationOffice.id : null,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

function buildUrl(from: string, to: string, page: number, useCantons: boolean): string {
  const p = new URLSearchParams();
  // keyword: server-side full text (the only locality-mapping filter the API
  // honours — `query`/`registrationOffices` are silently ignored, INGEST-PLAN
  // §0). cantons=ZH is defense-in-depth; the municipalityId post-filter is the
  // precise gate. If keyword+cantons ever returns empty we fall back to
  // keyword-only (see runEpublikation).
  p.set("keyword", "Regensdorf");
  if (useCantons) p.set("cantons", "ZH");
  p.set("publicationStates", "PUBLISHED");
  p.set("publicationDate.start", from);
  p.set("publicationDate.end", to);
  p.set("pageRequest.size", String(PAGE_SIZE));
  p.set("pageRequest.page", String(page));
  p.set("pageRequest.sortOrders[0].name", "publicationDate");
  p.set("pageRequest.sortOrders[0].direction", "DESC");
  return `${API}?${p.toString()}`;
}

async function fetchPage(
  env: Env,
  from: string,
  to: string,
  page: number,
  useCantons: boolean,
): Promise<{ total: number; content: unknown[]; rawBody: string }> {
  const res = await fetch(buildUrl(from, to, page, useCantons), {
    headers: { "user-agent": env.REGI_USER_AGENT },
  });
  if (!res.ok) {
    // Surfaces to the orchestrator's per-source try/catch — one bad source
    // never aborts the cron run (CLAUDE.md §4).
    throw new Error(`epublikation: HTTP ${res.status} on page ${page}`);
  }
  const rawBody = await res.text();
  const env2 = listEnvelope.parse(JSON.parse(rawBody));
  return { total: env2.total, content: env2.content, rawBody };
}

function mapItem(meta: EpublicationMeta): Candidate | null {
  const publishedAt = new Date(meta.publicationDate);
  if (Number.isNaN(publishedAt.getTime())) return null;
  return {
    externalId: meta.id,
    title: meta.title.de,
    publishedAt,
    rawHash: canonicalRawHash(meta),
  };
}

export async function runEpublikation(env: Env): Promise<SourceRunResult> {
  const now = new Date();
  const to = ymd(now);
  const from = ymd(new Date(now.getTime() - WINDOW_DAYS * 86_400_000));

  // Defense-in-depth query first; fall back to keyword-only if it is
  // unexpectedly empty (precision A: the municipalityId post-filter still
  // guarantees Regensdorf precision either way).
  let useCantons = true;
  let first = await fetchPage(env, from, to, 0, useCantons);
  if (first.total === 0 && first.content.length === 0) {
    console.warn("epublikation: keyword+cantons=ZH returned empty; falling back to keyword-only");
    useCantons = false;
    first = await fetchPage(env, from, to, 0, useCantons);
  }

  // Cap-2 (operative) — and thereby Cap-1, since 1000 < 5000. A `total` this
  // large means the keyword filter did not apply: degrade loudly, persist
  // nothing, do not advance freshness (ADR 0009).
  if (first.total > PLAUSI_TOTAL_MAX) {
    console.error(
      `epublikation degraded: total=${first.total} > PLAUSI_TOTAL_MAX=${PLAUSI_TOTAL_MAX}; no persist`,
    );
    return {
      fetched: 0,
      persisted: 0,
      unchanged: 0,
      skipped: 0,
      filteredOut: 0,
      degraded: true,
    };
  }

  const pages = [first];
  for (let page = 1; page < MAX_PAGES; page++) {
    const prev = pages[page - 1];
    if (!prev || prev.content.length < PAGE_SIZE) break;
    pages.push(await fetchPage(env, from, to, page, useCantons));
  }

  // Append-only byte-faithful audit trail, one content-addressed object per
  // fetched page (CLAUDE.md §7, ADR 0009).
  const auditKeys: string[] = [];
  for (const pg of pages) {
    auditKeys.push(await putRawAudit(env.RAW, SLUG, pg.rawBody));
  }

  let skipped = 0;
  let filteredOut = 0;
  const candidates: Candidate[] = [];
  let fetched = 0;
  for (const pg of pages) {
    for (const raw of pg.content) {
      fetched++;
      const parsed = publicationListItem.safeParse(raw);
      if (!parsed.success) {
        skipped++;
        continue;
      }
      const { meta } = parsed.data;
      if (meta.registrationOffice?.municipalityId !== "96") {
        filteredOut++;
        continue;
      }
      const cand = mapItem(meta);
      if (!cand) {
        skipped++;
        continue;
      }
      candidates.push(cand);
    }
  }

  const db = getDb(env.DATABASE_URL);

  // Idempotent identity upsert (ADR 0009). last_synced_at is deliberately NOT
  // set here — only after a clean persist below, so a degraded/failed run
  // never advances the freshness signal.
  const ensured = await db
    .insert(sources)
    .values(SOURCE)
    .onConflictDoUpdate({
      target: sources.slug,
      set: { name: SOURCE.name, url: SOURCE.url, license: SOURCE.license },
    })
    .returning({ id: sources.id });
  const sourceId = ensured[0]?.id;
  if (!sourceId) throw new Error("epublikation: ensureSource returned no id");

  // Pre-fetch this source's known hashes; decide insert/update/skip in memory
  // (volume is tiny). Unchanged rows are never written → no revalidate churn
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
        body: null, // v1: title + metadata only; per-rubric XML body is a follow-up
        publishedAt: c.publishedAt,
        rawHash: c.rawHash,
      })
      .onConflictDoUpdate({
        target: [publications.sourceId, publications.externalId],
        set: {
          title: c.title,
          body: null,
          publishedAt: c.publishedAt,
          rawHash: c.rawHash,
          updatedAt: new Date(),
        },
      });
    persisted++;
  }

  // Advance freshness only on a clean run (slug-upsert avoids needing a
  // where-operator import; the worker never imports the @regi/db index).
  await db
    .insert(sources)
    .values({ ...SOURCE, lastSyncedAt: new Date() })
    .onConflictDoUpdate({ target: sources.slug, set: { lastSyncedAt: new Date() } });

  console.log(
    `epublikation: fetched=${fetched} persisted=${persisted} unchanged=${unchanged} ` +
      `skipped=${skipped} filteredOut=${filteredOut} audit=${auditKeys.join(",")}`,
  );

  return { fetched, persisted, unchanged, skipped, filteredOut, degraded: false };
}

export { REVALIDATE_TAG, SLUG };
