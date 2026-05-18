import { createHash } from "node:crypto";
import { type NewsRow, newsIsland, newsRow } from "./schema";

/**
 * Pure extraction for the regensdorf-news embedded-JSON island (ADR 0013).
 * No I/O — everything here is deterministic on its string input, so it is
 * unit-testable in isolation the moment a test harness exists (CLAUDE.md §4
 * "Parser in parse.ts"; ADR 0013 mandates the per-field extraction be tested).
 */

export type NewsCandidate = {
  externalId: string;
  title: string;
  publishedAt: Date;
  category: string;
  url: string;
  rawHash: string;
};

// Minimal, fixed HTML-entity decoder. The CMS encodes the `data-entities`
// attribute with exactly these; `&amp;` is decoded LAST so an encoded literal
// like `&amp;lt;` becomes the text `&lt;`, never `<` (standard safe order).
const NAMED: Record<string, string> = {
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function decodeHtmlEntities(s: string): string {
  let out = s;
  for (const [ent, ch] of Object.entries(NAMED)) out = out.split(ent).join(ch);
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)));
  out = out.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number.parseInt(d, 10)));
  return out.split("&amp;").join("&");
}

/**
 * Locate the island by stable id + extract its `data-entities` attribute
 * (ADR 0013: bind to the data contract, never positional HTML). Returns the
 * HTML-entity-decoded JSON string, or null if the island is absent — caller
 * treats absence as a loud degrade, not a crash (ADR 0013).
 */
export function extractIslandJson(html: string): string | null {
  // The <table> carries id + data-webpack-module + data-entity-type; the
  // attribute order is not guaranteed, so anchor on id="informationList" then
  // find its data-entities="...". Inner JSON quotes are &quot;-encoded, so the
  // attribute's real delimiter " is unambiguous.
  const tag = html.match(/<table\b[^>]*\bid="informationList"[^>]*>/);
  if (!tag) return null;
  const attr = tag[0].match(/\bdata-entities="([^"]*)"/);
  if (!attr || attr[1] === undefined) return null;
  return decodeHtmlEntities(attr[1]);
}

/** Extract + JSON.parse + envelope-validate. Returns the raw row array, or
 * null on absent/unparseable island (→ degrade). */
export function parseNewsIsland(html: string): unknown[] | null {
  const json = extractIslandJson(html);
  if (json === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  const env = newsIsland.safeParse(parsed);
  if (!env.success) return null;
  return env.data.data;
}

// Single documented field regex (ADR 0013): the `name` value is
// `<a href="/_rte/information/<id>">Title</a>` after JSON.parse (real quotes).
const NAME_RE = /<a\s+href="\/_rte\/information\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i;

function cleanTitle(inner: string): string {
  return decodeHtmlEntities(inner.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Canonical raw_hash: SHA-256 over a fixed-order projection of the stable
 * fields the row derives from (ADR 0009 "Hash-1"). category + url are included
 * so a source-side reclassification or link change re-upserts (ADR 0013).
 */
export function canonicalRawHash(p: {
  externalId: string;
  title: string;
  publishedAt: string;
  category: string;
  url: string;
}): string {
  const canonical = JSON.stringify([p.externalId, p.title, p.publishedAt, p.category, p.url]);
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Map one validated island row to a publications candidate. Returns null when
 * the row cannot yield a stable identity (no /_rte/information/<id> link) or a
 * valid date — that item is skipped+counted per-item, never fatal (ADR 0009).
 */
export function mapRow(row: NewsRow): NewsCandidate | null {
  const m = row.name.match(NAME_RE);
  if (!m || m[1] === undefined || m[2] === undefined) return null;
  const externalId = m[1];
  const title = cleanTitle(m[2]);
  if (title === "") return null;

  // _datum is "YYYY-MM-DD HH:MM:SS" local (always 00:00:00 in practice);
  // pin to UTC so the stored instant is deterministic across runtimes.
  const publishedAt = new Date(`${row._datum.replace(" ", "T")}Z`);
  if (Number.isNaN(publishedAt.getTime())) return null;

  const category = row._kategorieId;
  // Stable source-native permalink; it 301s to /amtpub/<id> (press releases),
  // /aktuellesinformationen/<id>, or a document, but the /_rte form is the
  // durable identifier-bearing link.
  const url = `https://www.regensdorf.ch/_rte/information/${externalId}`;
  const rawHash = canonicalRawHash({
    externalId,
    title,
    publishedAt: publishedAt.toISOString(),
    category,
    url,
  });
  return { externalId, title, publishedAt, category, url, rawHash };
}

/** Per-item strict validation (ADR 0013). Returns the typed row or null;
 * null = drift/garbage for this row → skipped+counted by the caller. */
export function validateRow(raw: unknown): NewsRow | null {
  const r = newsRow.safeParse(raw);
  return r.success ? r.data : null;
}
