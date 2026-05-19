/**
 * /kolophon — the gazette's colophon: technical and design credits.
 * Honest stack list, no marketing prose. The "Stand: …" stamp tracks
 * the revision date.
 */

export const metadata = {
  title: "Kolophon – regi",
};

const STAND = "19.05.2026";

export default function KolophonPage() {
  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Kolophon</h1>
      </header>

      <div className="page__prose">
        <p>
          regi ist ein digitales Gemeindeblatt mit Echtzeit-Daten für Regensdorf ZH. Inhalte werden
          ohne redaktionelle Eingriffe aus öffentlichen Schweizer Quellen aggregiert.
        </p>

        <h2>Technik</h2>
        <dl>
          <dt>Frontend</dt>
          <dd>Next.js 16 (React 19, App Router, RSC), TypeScript strict, Tailwind v4</dd>

          <dt>Datenbezug</dt>
          <dd>
            Cloudflare Workers mit Hono, Cron-getrieben pro Quelle. On-Demand-Quellen (Fahrplan)
            ohne Persistenz.
          </dd>

          <dt>Persistenz</dt>
          <dd>Neon Postgres (EU, Frankfurt), Drizzle ORM. Rohdaten in Cloudflare R2.</dd>

          <dt>Typografie</dt>
          <dd>Geist Sans und Geist Mono via next/font.</dd>
        </dl>

        <h2>Design</h2>
        <p>
          «Amtsblatt, neu gesetzt» — Schweizer Funktionalismus, Amtsblatt-Tradition. Eine warme,
          gedämpfte Monochromie statt SaaS-Ästhetik; Hairline-Rhythmus statt Karten; Akzentfarbe
          ausschliesslich für Links und Auswahl. Light-Mode Default, Dark-Mode strukturell
          vorbereitet.
        </p>

        <h2>Code und Lizenzen</h2>
        <p>
          Quellcode öffentlich auf{" "}
          <a href="https://github.com/kintscher/regi" target="_blank" rel="noopener noreferrer">
            github.com/kintscher/regi
          </a>
          . Die verwendeten Bibliotheken (Next.js, React, Drizzle, Geist, Tailwind, Hono, Zod)
          stehen unter MIT- oder Apache-2.0-Lizenz. Inhaltliche Lizenzen pro Datenquelle finden sich
          auf <a href="/quellen">Quellen</a>.
        </p>

        <h2>Inspiration</h2>
        <p>
          Schweizer Plakat- und Buchtypografie (Müller-Brockmann, Crouwel), die redaktionelle
          Tonalität der NZZ und die strukturelle Disziplin gedruckter Gemeindeblätter.
        </p>

        <p className="page__meta">Stand: {STAND}</p>
      </div>
    </main>
  );
}
