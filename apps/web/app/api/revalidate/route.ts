import { revalidateTag } from "next/cache";
import { z } from "zod";

// Ingest → web cache-invalidation webhook (CLAUDE.md §4). The worker POSTs
// { tags } after a clean persist; we evict those tag-based caches so the next
// /amtliches request re-renders from the DB. One-directional — this never
// calls back into the worker (no revalidation loop, INGEST-PLAN §n).

const bodySchema = z.object({
  tags: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.INGEST_REVALIDATE_SECRET;
  if (!expected) {
    // Misconfiguration must fail loudly, never silently accept.
    return Response.json({ error: "revalidate secret not configured" }, { status: 500 });
  }
  if (request.headers.get("x-ingest-secret") !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    // Terse, no stack/schema leak.
    return Response.json(
      { error: "expected { tags: string[] } with at least one tag" },
      { status: 400 },
    );
  }

  for (const tag of parsed.data.tags) {
    // Webhook pattern (Next 16+): { expire: 0 } forces immediate invalidation.
    // profile="max" would be semantically wrong for an external trigger.
    // Next docs: "For webhooks ... [require] data to expire immediately."
    revalidateTag(tag, { expire: 0 });
  }
  return Response.json({ revalidated: parsed.data.tags.length });
}
