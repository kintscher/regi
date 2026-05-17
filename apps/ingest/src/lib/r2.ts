import { createHash } from "node:crypto";

/**
 * Append-only raw audit trail (CLAUDE.md §7). Content-addressed key
 * `<source>/<YYYY-MM-DD>/<sha256-hex>.json`: an identical body on the same day
 * yields the same key, so a re-poll is an idempotent no-op (INGEST-PLAN §d).
 * This is the byte-faithful record; `publications.raw_hash` is a deliberate
 * canonical projection instead (ADR 0009, "Hash-1"). 12-month retention is an
 * R2 bucket lifecycle rule configured out-of-band, not here.
 */
export async function putRawAudit(bucket: R2Bucket, source: string, body: string): Promise<string> {
  const hash = createHash("sha256").update(body).digest("hex");
  const day = new Date().toISOString().slice(0, 10);
  const key = `${source}/${day}/${hash}.json`;
  await bucket.put(key, body, {
    httpMetadata: { contentType: "application/json" },
  });
  return key;
}
