import type { Env } from "../env";
import { REVALIDATE_TAG, runEpublikation, SLUG } from "./epublikation";
import {
  runExistenzWeather,
  SLUG as WEATHER_SLUG,
  REVALIDATE_TAG as WEATHER_TAG,
} from "./existenz-weather";
import type { SourceRunResult } from "./types";

export interface IngestSource {
  /** Stable source slug; also the `sources.slug` row (ADR 0009). */
  slug: string;
  /** Cache tag the orchestrator revalidates after a clean persist (CLAUDE.md §4). */
  revalidateTag: string;
  run: (env: Env) => Promise<SourceRunResult>;
}

// Sources register here in implementation order (CLAUDE.md §6 / SOURCE-STRATEGY).
export const sources: IngestSource[] = [
  { slug: SLUG, revalidateTag: REVALIDATE_TAG, run: runEpublikation },
  { slug: WEATHER_SLUG, revalidateTag: WEATHER_TAG, run: runExistenzWeather },
];
