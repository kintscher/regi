import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { publications } from "@/lib/db/schema";

// Reads the live Neon dev branch on every request. A tag-based caching
// strategy follows with the ingestion worker (CLAUDE.md §4); this page exists
// only to validate the RSC → Drizzle → Neon pipeline end-to-end (§11.4).
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function AmtlichesPage() {
  const items = await db
    .select()
    .from(publications)
    .orderBy(desc(publications.publishedAt))
    .limit(50);

  return (
    <main>
      <h1>Amtliche Mitteilungen</h1>
      {items.length === 0 ? (
        <p>Keine Mitteilungen vorhanden.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <article>
                <time dateTime={item.publishedAt.toISOString()}>
                  {dateFormat.format(item.publishedAt)}
                </time>
                <h2>{item.title}</h2>
                {item.body ? <p>{item.body}</p> : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
