import type { Env } from "./env";
import { sources } from "./sources/registry";

// Run every registered source in isolation: one failing source must never
// abort the cron run (CLAUDE.md §4). The registry is empty until the first
// source lands in Sub-Schritt 3, so this is a no-op for now.
async function runAll(env: Env): Promise<{ slug: string; ok: boolean }[]> {
  const results: { slug: string; ok: boolean }[] = [];
  for (const source of sources) {
    try {
      await source.run(env);
      results.push({ slug: source.slug, ok: true });
    } catch (error) {
      console.error(`source ${source.slug} failed:`, error);
      results.push({ slug: source.slug, ok: false });
    }
  }
  return results;
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
