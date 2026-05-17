# CLAUDE.md – regi

> Diese Datei wird von Claude Code beim Start jeder Session automatisch geladen. Sie definiert verbindliche Standards. Bei Konflikt mit ad-hoc-Anweisungen gilt diese Datei, ausser der User überstimmt explizit.

---

## 1. Projekt-Identität

**Name:** `regi` (kleingeschrieben, ohne Suffix). Lokaler Spitzname für Regensdorf, ohne Erklärung verständlich für Einwohner.

**Domain:** `regi.ch` (primär) bzw. `regi.app` als Fallback.

**Mission:** Eine automatisierte, rechtskonforme, schnelle Aggregator-Plattform für die Gemeinde Regensdorf ZH inkl. Ortsteile Watt und Adlikon. Alle Inhalte werden ohne manuelle Redaktion aus offenen Datenquellen bezogen (siehe `docs/data-sources.md`).

**Zielgruppe:** Einwohner (Alltag) und Regensdorf-Interessierte (Zuzüger, Pendler). Keine Touristen-Plattform, kein Behörden-Klon.

**Charakter:** Ruhig, präzise, dicht, eigenständig. Kein SaaS-Vibe. Kein Web-3-Vibe. Eher: digitales Gemeindeblatt mit Echtzeit-Daten.

**Sprache:** UI ausschliesslich Hochdeutsch (CH-Schreibweise: «ss» statt «ß», Anführungszeichen «», Datumsformat TT.MM.JJJJ, Zeit HH.MM, Währung CHF mit Tausendertrennzeichen). Code, Kommentare, Commits, Issues: Englisch.

**Repos:**
- `regi-web` – Next.js Frontend (dieses Repo)
- `regi-ingest` – Cloudflare Workers für Datenbezug (separates Repo)

---

## 2. Tech-Stack (verbindlich)

### Frontend (`regi-web`)
- **Next.js** App Router (aktuelle stable Major), TypeScript im Strict Mode
- **React** mit Server Components als Default
- **Tailwind CSS** v4 (CSS-first, keine `tailwind.config.ts`-Bloat)
- **Drizzle ORM** + **Neon Postgres** (serverless, HTTP-Driver in RSC)
- **nuqs** für URL-State (alle Filter, Suchparameter)
- **Zod** für Schema-Validierung externer Daten
- Hosting: **Vercel** (Hobby-Tier reicht initial)

### Ingestion (`regi-ingest`)
- **Cloudflare Workers** + **Hono** + **Drizzle** (Neon HTTP-Driver)
- Cron Triggers pro Quelle, granulare Schedules
- Worker triggert Next.js Webhook `/api/revalidate` mit Tags nach jedem Lauf
- Rohdaten in **Cloudflare R2** (Bucket `regi-raw`) für 12 Monate

### Tooling
- **pnpm** (nie npm/yarn)
- **Biome** für Lint/Format (nicht ESLint + Prettier)
- **TypeScript strict** + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- **Vitest** für Unit-Tests, **Playwright** nur für kritische E2E-Flows

### Explizit nicht verwenden
- shadcn/ui als Default-Bibliothek (höchstens als Referenz-Code, kopieren und anpassen)
- Radix wo Browser-nativ funktioniert (`<dialog>`, `<details>`, `<select>`)
- Framer Motion (CSS Transitions reichen, plus View Transitions API)
- React Query / SWR auf Server-Side (RSC + Drizzle macht das obsolet)
- Zustand / Redux (URL ist der State)
- Headless UI, Mantine, Chakra, MUI, NextUI, Aceternity

---

## 3. Repo-Struktur

```
regi-web/
├── app/
│   ├── (public)/
│   │   ├── page.tsx             # Heute-Übersicht
│   │   ├── amtliches/           # ePublikation-Mitteilungen
│   │   ├── presse/              # Lokal-/Regional-Presse
│   │   ├── veranstaltungen/     # Eventfrog
│   │   ├── ov/                  # ÖV-Abfahrten Live
│   │   ├── abfall/              # Abfallkalender
│   │   ├── wetter/              # Wetter + Luftqualität
│   │   ├── karte/               # Interaktive Karte
│   │   ├── statistik/           # Gemeindeporträt-Daten
│   │   └── ueber/               # Kolophon, Quellen, Lizenzen
│   ├── api/
│   │   ├── revalidate/route.ts  # Webhook vom Ingestion-Worker
│   │   └── og/[slug]/route.tsx  # Dynamic OG Images
│   └── layout.tsx
├── components/
│   ├── primitives/              # Eigene Bausteine (nicht shadcn)
│   ├── feed/                    # NewsCard, FilterBar, etc.
│   └── widgets/                 # Wetter, ÖV, Abfall
├── lib/
│   ├── db/
│   │   ├── schema.ts            # Drizzle
│   │   └── queries/             # Typed query functions
│   ├── sources/                 # TS-Interfaces der externen Quellen
│   └── format/                  # CH-Formatters (date, currency, …)
├── docs/
│   ├── data-sources.md          # Recherche-Bericht
│   ├── design-system.md         # Wird vom frontend-design-Skill befüllt
│   └── decisions/               # ADRs
└── public/
```

---

## 4. Code-Standards

### Server / Client Components
- **Server Component ist Default.** Jede neue Komponente startet ohne `'use client'`.
- Client-Components nur bei: Browser-APIs, Event-Listener komplexer als `<form action>`, Client-State, Drittlib die `window` braucht.
- Datenbankzugriff ausschliesslich in Server Components / Server Actions / Route Handlers. Kein `/api/items` für eigene Daten – RSC liest direkt mit Drizzle.

### Datenfluss
```ts
// gut – RSC liest direkt
export default async function Page() {
  const items = await db.query.publications.findMany({
    where: eq(publications.bfsNr, 96),
    orderBy: desc(publications.publishedAt),
    limit: 50,
  })
  return <PublicationsList items={items} />
}
```

### Caching & Revalidation
- Tags-basiert via `unstable_cache` + `revalidateTag`. Tag-Konventionen: `source:epublikation`, `source:transport`, `entity:item:<id>`.
- Page-Level `export const revalidate = N` nur für ganze Routen mit klarem TTL.
- Worker postet nach Ingestion an `/api/revalidate` mit `{ tags: [...] }`. Secret-Header `x-ingest-secret`.

### URL als State
- Filter, Suchqueries, Pagination immer via `nuqs` in der URL.
- Keine `useState` für irgendetwas, das man teilen können sollte.

### Externe Daten
- Jede externe Quelle: Zod-Schema in `lib/sources/<name>/schema.ts`, Parser in `parse.ts`, Fetcher im Worker. Frontend sieht nur die DB-Tabelle, nie Rohdaten.
- Raw-Response wird im Worker zusätzlich in R2 (Bucket `regi-raw`) abgelegt mit Pfad `<source>/<YYYY-MM-DD>/<hash>.json`.

### TypeScript
- Strict, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Keine `any`. `unknown` + Narrowing. Bei externen Daten Zod.
- Keine Enums (Union-Strings nutzen).
- DB-Types aus Drizzle, nie händisch dupliziert.

### Fehlerbehandlung
- Server Actions geben `{ ok: true, data } | { ok: false, error }` zurück, nie throws an die UI.
- Worker-Ingestion: jeder Source-Run ist isoliert in `try/catch`; eine Quelle, die kippt, bricht nicht den ganzen Cron-Lauf.
- Sentry oder Axiom als Logging-Sink (TBD), nicht `console.log` in Production.

### Performance-Budget
- LCP < 2.0s auf 3G, CLS < 0.05, INP < 200ms.
- Kein Drittanbieter-Script (kein Analytics-Bloat). Wenn Analytics: Plausible self-hosted oder Vercel Analytics.
- Bilder ausschliesslich via `next/image`. Bilder vor Commit durch `sharp`-Pipeline (max 1600px wide, AVIF + WebP).
- Bundle-Size Budget pro Route: 50kb JS gzipped. CI-Check.

---

## 5. Design & UI – Skill-Delegation

Design-Entscheidungen werden **nicht** in dieser Datei festgehalten. Stattdessen orchestriert Claude Code die folgenden installierten Skills:

### Beim Aufsetzen des Design-Systems (einmalig, zu Beginn)
Verwende `/frontend-design`, um das visuelle System für regi zu erarbeiten. Eingabe-Kontext:

> Zielgruppe: Einwohner der Gemeinde Regensdorf ZH und Regensdorf-Interessierte. Charakter: digitales Gemeindeblatt mit Echtzeit-Daten, redaktionell, Schweizer Designerbe, ruhig und präzise. Keine SaaS-/Dashboard-Anmutung. Inspirations-Anker: Regensdorfer Wappen (Rot mit weisser Burg) als Brand-Quelle, Editorial-Sites wie NZZ/FT/Nieman Lab als Tonalitäts-Referenz, Swiss-Design-Tradition (Müller-Brockmann, Crouwel). Light Mode ist Default (Public-Service-Charakter), Dark Mode gleichwertig.

Das Ergebnis (Farbtokens, Typo-Skala, Spacing, Layout-Grid, Komponenten-Primitives) dokumentiert Claude Code in `docs/design-system.md` und als CSS-Variablen in `app/globals.css`.

### Beim Bauen oder Erweitern von UI
- **Neue Komponenten / Seiten:** `/frontend-design` aufrufen, das bestehende `docs/design-system.md` als Eingabe übergeben, damit Konsistenz gewahrt bleibt.
- **Bestehende UI verbessern / verfeinern:** `/impeccable` aufrufen für Kritik, Polish, Hierarchie-Optimierung, Mikro-Interaktionen.

### Vor jedem Merge
- **Pflicht-Audit:** `/web-design-guidelines` über alle geänderten UI-Files laufen lassen. Findings werden im PR adressiert oder bewusst als Trade-off im Description festgehalten.

### Reihenfolge der Skill-Nutzung pro Feature
1. `/frontend-design` für den ersten Wurf (mit Design-System als Kontext)
2. `/impeccable` für die Verfeinerung
3. `/web-design-guidelines` als Gate vor dem Commit

### Bei Unklarheit über Skill-Verfügbarkeit
- `/find-skills` aufrufen, bevor manuell improvisiert wird.

### Verbindliche Leitplanken (auch ohne Skill gültig)
- Kein Drittanbieter-UI-Kit (siehe Sektion 2 «Explizit nicht verwenden»).
- Accessibility: semantisches HTML, Keyboard-Navigation, sichtbarer Focus, WCAG AA Kontrast, `prefers-reduced-motion` respektieren.
- Dark & Light Mode beide vollwertig.
- Wortmarke `regi` immer kleingeschrieben.

Alles andere – Farben, Schriften, Skalen, Komponenten-Stil – ist **Output der Skills**, nicht Vorgabe dieser Datei.

---

## 6. Datenquellen (Übersicht der Top-Integrationen)

Vollständige Recherche in `docs/data-sources.md`. MVP-Pflicht-Liste:

| # | Quelle | Frequenz | Tags | Worker-Datei |
|---|--------|----------|------|--------------|
| 1 | ePublikation.ch / Amtsblattportal REST | 30 min | `source:epublikation` | `sources/epublikation.ts` |
| 2 | transport.opendata.ch (ÖV) | on-demand | `source:transport` | `sources/transport.ts` |
| 3 | Eventfrog API | 1 h | `source:eventfrog` | `sources/eventfrog.ts` |
| 4 | api.existenz.ch (Wetter) | 15 min | `source:weather` | `sources/existenz-weather.ts` |
| 5 | Newsroom Kanton ZH RSS | 30 min | `source:zh-news` | `sources/zh-newsroom.ts` |
| 6 | zuonline.ch RSS (Regensdorf) | 2 h | `source:zuonline` | `sources/zuonline.ts` |
| 7 | OpenHolidays API (Ferien ZH) | täglich | `source:holidays` | `sources/holidays.ts` |
| 8 | Statistisches Amt ZH (BFS 96) | wöchentlich | `source:stats-zh` | `sources/stats-zh.ts` |
| 9 | Zefix REST (Firmen 8105/8106) | täglich | `source:zefix` | `sources/zefix.ts` |
| 10 | Abfallkalender (PDF/mycity Scraping) | jährlich + täglich | `source:waste` | `sources/waste.ts` |
| 11 | Hydrodaten Furtbach | 15 min | `source:hydro` | `sources/hydro.ts` |
| 12 | Luftqualität AWEL/NABEL | stündlich | `source:air` | `sources/air-quality.ts` |
| 13 | OSM Overpass (POIs Bounding-Box) | wöchentlich | `source:osm` | `sources/osm.ts` |
| 14 | Wikidata Q64205 + Wikipedia | monatlich | `source:wikidata` | `sources/wikidata.ts` |
| 15 | swisstopo Karten-Tiles | statisch | – | client-side |

**Reihenfolge der Implementierung:** ePublikation → Transport → Eventfrog → Existenz-Weather → ZH-Newsroom RSS. Erst wenn diese fünf produktiv laufen, weitere ergänzen.

---

## 7. Rechtliches & Ethisches (knapp)

- **URG / amtliche Inhalte:** alles aus ePublikation, Amtsblatt, Kapo, Statistik ist nach Art. 5 URG frei nutzbar. Quellenangabe trotzdem Pflicht.
- **Presse:** nur Titel + max. 200 Zeichen Anriss + Datum + Quelle + Link. Keine Volltexte cachen.
- **Lizenzen offen halten:** Footer-Seite `/quellen` listet jede Quelle inkl. Lizenz und letzten Sync. Auto-generiert aus DB.
- **robots.txt:** jeder Worker-Fetcher liest die `robots.txt` der Quelle einmal pro Woche, blockierte Pfade nie crawlen.
- **User-Agent:** `regi/1.0 (+https://regi.ch; contact: yannik@kintscher.ai)`.
- **revDSG:** Detail-Seiten amtlicher Publikationen mit Personenbezug bekommen `<meta name="robots" content="noindex">`.
- **Audit-Trail:** Rohdaten in R2 (`regi-raw`) für 12 Monate, Hash + Source + Timestamp in DB.

---

## 8. Git & Workflow

### Commits
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- Englisch, Imperativ. Max. 72 Zeichen erste Zeile.
- Beispiel: `feat(ingest): add Eventfrog source with hourly cron`

### Branches
- `main` ist deploybar.
- Feature-Branches: `feat/<scope>-<kebab>`. Klein halten, Squash-Merge.

### PRs
- Beschreibung erklärt **Warum**, Diff erklärt **Was**.
- Screenshots bei UI-Änderungen, vorher/nachher.
- `/autofix-pr` darf zum Schluss laufen, ersetzt aber keine inhaltliche Review.

### Vor jedem Commit
- `pnpm typecheck && pnpm lint && pnpm test`
- Bei UI-Änderung: `/web-design-guidelines` über die geänderten Files, Findings im PR adressieren.

---

## 9. Arbeits-Regeln für Claude Code

### Mache
- Rufe die installierten Skills aktiv auf, statt Design- oder UX-Entscheidungen ad hoc zu treffen.
- Bei Unklarheit über Anforderungen: nachfragen, statt raten.
- Schreibe wenig Code, der viel tut.
- Bevorzuge Lösungen, die in 12 Monaten noch funktionieren (Web Platform > Framework-Feature).
- Stelle Architektur-Entscheidungen als ADR in `docs/decisions/<NNNN>-<slug>.md` fest.
- Nutze `/advisor` bei kritischen Architektur- oder Design-Weggabelungen.

### Tu nicht
- Keine neuen Abhängigkeiten ohne Begründung im PR-Description.
- Keine UI-Bibliotheken ohne Rücksprache (kein Mantine, kein MUI, kein NextUI, kein Aceternity).
- Keine eigenen Design-Tokens improvisieren – das ist Job von `/frontend-design`.
- Kein Refactor «en passant» – ein PR, ein Thema.
- Keine Kommentare, die wiederholen, was der Code sagt. Kommentare erklären das *Warum*.
- Keine Mock-Daten in Production-Code. Test-Daten gehören in Fixtures.
- Keine TODO-Kommentare ohne Issue-Link.

### Bei Konflikt mit dieser Datei
- Den User direkt darauf hinweisen und fragen, ob bewusst abgewichen werden soll. Wenn ja: ADR schreiben, das die Abweichung dokumentiert.

---

## 10. Definition of Done (pro Feature)

- [ ] Funktionalität in beiden Modes (Light/Dark), beiden Breakpoint-Klassen (Mobil < 640, Desktop > 1024) geprüft
- [ ] `/web-design-guidelines` über UI-Änderungen gelaufen, Findings adressiert
- [ ] Keyboard-navigierbar, Focus sichtbar
- [ ] Performance-Budget eingehalten (LCP/CLS/INP, Bundle-Size)
- [ ] Datenquelle (falls extern) hat Rate-Limit-Respekt, Error-Handling, Audit-Trail
- [ ] Caching-Strategie definiert (revalidate / tags)
- [ ] Quellen-Eintrag in `/quellen`-Seite wird automatisch erzeugt
- [ ] Lizenz / Quellenangabe in UI sichtbar oder im Kolophon
- [ ] Tests für die Kern-Logik (Parser, Formatter, Query)
- [ ] Doku in `docs/` aktualisiert (wenn Architektur betroffen)
- [ ] Commit-Message konventional, PR-Description erklärt das Warum

---

## 11. Sofortige nächste Schritte (zum Projektstart)

1. `pnpm create next-app@latest regi-web --typescript --tailwind --app --src-dir=false`
2. Neon-Projekt `regi` anlegen, Branches `main` + `dev`, Connection-Strings in `.env.local`
3. Drizzle aufsetzen, Schema-Skelett für `publications`, `press_items`, `events`, `waste_dates`, `sources` anlegen, erste Migration
4. Eine erste Seite `/amtliches` mit Hardcoded-Mock-Daten aus der DB rendern – komplette Pipeline End-to-End validieren. **Noch kein Design-System:** neutral (Schwarz auf Weiss, System-Schrift); Zweck ist ausschliesslich Pipeline-Validierung, nicht Optik.
5. **`/frontend-design` aufrufen** mit dem in Sektion 5 hinterlegten Kontext *und* der bereits stehenden `/amtliches`-Seite mit echtem Inhalt als Eingabe → Ergebnis nach `docs/design-system.md` und `app/globals.css`; danach `/amtliches` in diesem Stil überarbeiten
6. **`/web-design-guidelines` und `/impeccable`** über das Ergebnis laufen lassen, iterieren
7. Separates Repo `regi-ingest` mit Wrangler + Hono + Drizzle anlegen
8. Erste Source `epublikation.ts` implementieren: Fetch + Zod + Upsert + Revalidate-POST
9. Wenn Daten in der DB landen und auf der Seite erscheinen: zweite Quelle. Erst dann weiter polieren.

> Schritt 4/5: `/frontend-design` wurde bewusst hinter die Pipeline-Validierung verschoben – das Design-System arbeitet mit echtem Inhalt statt mit Vermutungen (ADR 0003).

**Reihenfolge ist nicht verhandelbar.** Erst Pipeline, dann Inhalt, dann Politur. Nicht umgekehrt.
