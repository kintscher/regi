import type { Env } from "../env";
import { REVALIDATE_TAG, runEpublikation, SLUG } from "./epublikation";
import type { SourceRunResult } from "./types";

export interface IngestSource {
  /** Stable source slug; also the `sources.slug` row (ADR 0009). */
  slug: string;
  /** Cache tag the orchestrator revalidates after a clean persist (CLAUDE.md §4). */
  revalidateTag: string;
  run: (env: Env) => Promise<SourceRunResult>;
}

// Sources register here in implementation order (CLAUDE.md §6).
export const sources: IngestSource[] = [
  { slug: SLUG, revalidateTag: REVALIDATE_TAG, run: runEpublikation },
];
