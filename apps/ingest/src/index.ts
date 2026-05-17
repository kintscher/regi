import type { Env } from "./env";
import { postRevalidate } from "./lib/revalidate";
import { sources } from "./sources/registry";
import type { SourceRunResult } from "./sources/types";

type RunOutcome = { slug: string; ok: boolean; result?: SourceRunResult };

// Run every registered source in isolation: one failing source must never
// abort the cron run (CLAUDE.md §4). A clean run that actually wrote rows
// invalidates that source's cache tag — degraded or zero-persist runs do not,
// avoiding needless Vercel re-renders (ADR 0009).
async function runAll(env: Env): Promise<RunOutcome[]> {
  const outcomes: RunOutcome[] = [];
  for (const source of sources) {
    try {
      const result = await source.run(env);
      console.log(`source ${source.slug}:`, result);
      if (!result.degraded && result.persisted > 0) {
        await postRevalidate(env.SITE_URL, env.INGEST_REVALIDATE_SECRET, [source.revalidateTag]);
      }
      outcomes.push({ slug: source.slug, ok: true, result });
    } catch (error) {
      console.error(`source ${source.slug} failed:`, error);
      outcomes.push({ slug: source.slug, ok: false });
    }
  }
  return outcomes;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(runAll(env).then((r) => console.log("scheduled run:", r)));
  },

  // No router framework in v1 (ADR 0009): exactly one manual-trigger route,
  // guarded by the shared ingest secret. Production uses scheduled() above;
  // `wrangler dev --test-scheduled` exposes /__scheduled for the cron path.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/__run") {
      if (request.headers.get("x-ingest-secret") !== env.INGEST_REVALIDATE_SECRET) {
        return new Response("forbidden", { status: 403 });
      }
      const ran = await runAll(env);
      return Response.json({ ok: true, ran });
    }
    return new Response("not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
