import { neon } from "@neondatabase/serverless";
import { ulid } from "ulid";

// Idempotent seed for sources that have NO worker (on-demand pattern, ADR
// 0011). The cron sources self-register via ensureSource() on their first
// run; on-demand sources never run a worker, so their /quellen + attribution
// row must be seeded here. `last_synced_at` is intentionally left NULL —
// "never synced because never persisted" (verified nullable, ADR 0011).
// Safe to re-run: ON CONFLICT (slug) DO NOTHING. Not destructive.

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED (or DATABASE_URL) not set");
}
const sql = neon(url);

const STATIC_SOURCES: { slug: string; name: string; url: string; license: string }[] = [
  {
    slug: "transport",
    name: "OpenTransport (transport.opendata.ch)",
    url: "https://transport.opendata.ch",
    license:
      "Public Transport API — community-maintained, data from SBB/CFF/FFS, opentransportdata.swiss",
  },
];

async function main(): Promise<void> {
  let inserted = 0;
  for (const s of STATIC_SOURCES) {
    const rows = await sql`
      INSERT INTO sources (id, name, slug, url, license)
      VALUES (${ulid()}, ${s.name}, ${s.slug}, ${s.url}, ${s.license})
      ON CONFLICT (slug) DO NOTHING
      RETURNING slug
    `;
    if (rows.length > 0) inserted++;
  }
  console.log(
    `Static sources seeded: ${inserted} inserted, ${STATIC_SOURCES.length - inserted} already present.`,
  );
}

main().catch((error: unknown) => {
  console.error("Static-source seed failed:", error);
  process.exit(1);
});
