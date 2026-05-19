import type { Env } from "./env";
import { postRevalidate } from "./lib/revalidate";
import { sources } from "./sources/registry";
import type { SourceRunResult } from "./sources/types";

// `ok` reflects the *persist* phase only (issue #11). `revalidate` is a
// separate, non-fatal signal: a clean persist is a successful run even when
// the cache-invalidation webhook is unreachable — the rows are in Neon and
// `sources.last_synced_at` already advanced inside the source's run().
type RevalidateStatus = "ok" | "skipped" | "failed";
type RunOutcome = {
  slug: string;
  ok: boolean;
  result?: SourceRunResult;
  revalidate?: RevalidateStatus;
};

// One retry with a fixed backoff, then give up. No dead-letter queue in v1
// (issue #11, deliberate): a missed revalidate is logged for observability
// and left for a later cron run to repair. Known residual gap — if the next
// run's raw_hash is unchanged it persists nothing and therefore does not
// re-fire revalidate, so the Next cache stays stale until the next genuine
// upstream content change. Accepted for v1; revisit with a stale-pending
// marker if observed in production (tracked in #11's follow-up discussion).
const REVALIDATE_MAX_ATTEMPTS = 2; // 1 initial + 1 retry
const REVALIDATE_BACKOFF_MS = 5_000;

// Logging stays on console.* (warn for a recoverable revalidate miss, error
// for a hard persist failure): CLAUDE.md §4 leaves the Sentry/Axiom sink
// explicitly TBD, and the whole worker is console-based. A separate logs
// channel is out of scope for #11 and would force the deferred sink choice.
async function revalidateWithRetry(env: Env, slug: string, tag: string): Promise<RevalidateStatus> {
  for (let attempt = 1; attempt <= REVALIDATE_MAX_ATTEMPTS; attempt++) {
    try {
      await postRevalidate(env.SITE_URL, env.INGEST_REVALIDATE_SECRET, [tag]);
      if (attempt > 1) {
        console.log(`source ${slug}: revalidate recovered on attempt ${attempt}`);
      }
      return "ok";
    } catch (error) {
      const lastAttempt = attempt === REVALIDATE_MAX_ATTEMPTS;
      // Per-source revalidate-failure trace (observability, not persistence):
      // attempt counter is the signal an operator greps for. Never throws —
      // the run already succeeded (#11).
      console.warn(
        `source ${slug}: revalidate attempt ${attempt}/${REVALIDATE_MAX_ATTEMPTS} failed` +
          (lastAttempt
            ? " — giving up, next content-changing run will re-trigger"
            : `, retrying in ${REVALIDATE_BACKOFF_MS}ms`),
        error,
      );
      if (lastAttempt) return "failed";
      await new Promise((resolve) => setTimeout(resolve, REVALIDATE_BACKOFF_MS));
    }
  }
  return "failed";
}

// Run every registered source in isolation: one failing source must never
// abort the cron run (CLAUDE.md §4). Persist and revalidate are decoupled
// (issue #11): the source's run() owns persist + last_synced_at; the
// orchestrator only fires the cache-invalidation webhook afterwards. A clean
// run that actually wrote rows invalidates that source's cache tag — degraded
// or zero-persist runs do not, avoiding needless Vercel re-renders (ADR 0009).
async function runAll(env: Env): Promise<RunOutcome[]> {
  const outcomes: RunOutcome[] = [];
  for (const source of sources) {
    // --- Persist phase: a throw here is a genuine source-run failure. ---
    let result: SourceRunResult;
    try {
      result = await source.run(env);
      console.log(`source ${source.slug}:`, result);
    } catch (error) {
      console.error(`source ${source.slug} failed:`, error);
      outcomes.push({ slug: source.slug, ok: false });
      continue;
    }

    // --- Revalidate phase: isolated, never flips `ok` to false (#11). ---
    let revalidate: RevalidateStatus = "skipped";
    if (!result.degraded && result.persisted > 0) {
      revalidate = await revalidateWithRetry(env, source.slug, source.revalidateTag);
    }
    outcomes.push({ slug: source.slug, ok: true, result, revalidate });
  }

  // Aggregate revalidate health for the run (observability counter, #11).
  const stale = outcomes.filter((o) => o.revalidate === "failed").map((o) => o.slug);
  if (stale.length > 0) {
    console.warn(`revalidate: ${stale.length} source(s) left stale-pending: ${stale.join(", ")}`);
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
