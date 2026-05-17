import type { Env } from "../env";

export interface IngestSource {
  /** Stable source slug; also the `sources.slug` row (ADR 0009). */
  slug: string;
  run: (env: Env) => Promise<void>;
}

// Sources register here in implementation order (CLAUDE.md §6). Empty until
// ePublikation lands in Sub-Schritt 3.
export const sources: IngestSource[] = [];
