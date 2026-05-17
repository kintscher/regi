/**
 * Notify the web app to invalidate tag-based caches after ingestion
 * (CLAUDE.md §4). One-directional: the web route never calls back into the
 * worker, so there is no revalidation loop (INGEST-PLAN §n).
 */
export async function postRevalidate(
  siteUrl: string,
  secret: string,
  tags: string[],
): Promise<void> {
  const res = await fetch(new URL("/api/revalidate", siteUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": secret,
    },
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) {
    throw new Error(`revalidate failed: HTTP ${res.status}`);
  }
}
