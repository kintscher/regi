import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { ulid } from "ulid";

// Dev-only seed for end-to-end pipeline validation (§11.4). Idempotent:
// wipes the mock source and its rows, then reinserts. All content is freely
// invented and clearly marked (source slug `epublikation-test`,
// external_id `mock-NNN`). Never run against production.

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED (or DATABASE_URL) not set");
}
const sql = neon(url);

const SOURCE_SLUG = "epublikation-test";

const items: { title: string; body: string | null }[] = [
  {
    title: "Baugesuch Riedenhaldenstrasse 14, Regensdorf",
    body: "Die Bauherrschaft beantragt den Umbau eines bestehenden Einfamilienhauses mit Erweiterung des Wohnraums. Die Pläne liegen während der Einsprachefrist öffentlich auf. Einsprachen sind schriftlich an die Bauverwaltung zu richten.",
  },
  {
    title: "Konkurseröffnung über die Beispiel Bau AG, Watt",
    body: "Über die Beispiel Bau AG mit Sitz in Watt wurde der Konkurs eröffnet. Forderungen sind innert der gesetzlichen Frist beim zuständigen Konkursamt anzumelden.",
  },
  { title: "Stimmrechtsbeschwerde beim Bezirksrat Dielsdorf", body: null },
  {
    title: "Öffentliche Planauflage Quartierplan Adlikon",
    body: "Der Quartierplan für das Gebiet Adlikon liegt während 30 Tagen öffentlich auf. Betroffene Grundeigentümerinnen und Grundeigentümer können innert Frist Einwendungen erheben.",
  },
  { title: "Submission: Lieferung Streusalz Werkhof Winter 2026/27", body: null },
  {
    title: "Verkehrsanordnung Tempo 30 Schulhausstrasse, Watt",
    body: "Auf der Schulhausstrasse in Watt wird eine Höchstgeschwindigkeit von 30 km/h angeordnet. Die Massnahme dient der Verkehrssicherheit im Bereich der Schulanlage.",
  },
  {
    title: "Gemeindeversammlung Regensdorf – Traktandenliste",
    body: "Die nächste Gemeindeversammlung findet im Forum Regensdorf statt. Die Traktandenliste und die Weisungen sind auf der Gemeindekanzlei einsehbar.",
  },
  { title: "Wasserrechtskonzession Furtbach, Erneuerung", body: null },
  {
    title: "Bauabnahme Mehrzweckhalle Chrüzacher",
    body: "Die Schlussabnahme der sanierten Mehrzweckhalle Chrüzacher wurde durchgeführt. Allfällige Mängelrügen sind innert der vertraglichen Frist einzureichen.",
  },
  { title: "Liegenschaftenschätzung Adlikerstrasse 8, Adlikon", body: null },
];

async function main(): Promise<void> {
  // Children first — the FK is ON DELETE RESTRICT.
  await sql`DELETE FROM publications WHERE source_id IN (SELECT id FROM sources WHERE slug = ${SOURCE_SLUG})`;
  await sql`DELETE FROM sources WHERE slug = ${SOURCE_SLUG}`;

  const sourceId = ulid();
  await sql`
    INSERT INTO sources (id, name, slug, url, license)
    VALUES (${sourceId}, ${"ePublikation Test"}, ${SOURCE_SLUG}, ${"https://amtsblattportal.ch"}, ${"Public Domain (URG Art. 5)"})
  `;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    const externalId = `mock-${String(i + 1).padStart(3, "0")}`;
    const publishedAt = new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000);
    const rawHash = createHash("sha256").update(`${externalId}:${item.title}`).digest("hex");
    await sql`
      INSERT INTO publications (id, source_id, external_id, title, body, published_at, raw_hash)
      VALUES (${ulid()}, ${sourceId}, ${externalId}, ${item.title}, ${item.body}, ${publishedAt.toISOString()}, ${rawHash})
    `;
  }

  console.log(`Seeded source "${SOURCE_SLUG}" with ${items.length} publications.`);
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
