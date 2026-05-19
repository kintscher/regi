# Design System – regi

> Produced by `/frontend-design` (CLAUDE.md §5, ADR 0003) against the live
> `/amtliches` page with real (mock) content. This is the **master template**:
> every future list page (Presse, Veranstaltungen, ÖV, Statistik) reuses the
> tokens and primitives defined here. Tokens live in `app/globals.css`; this
> document is the rationale and the contract.

---

## Contents

1. [Rationale](#1-rationale)
2. [Colour tokens](#2-colour-tokens)
3. [Typography](#3-typography)
4. [Spacing](#4-spacing)
5. [Layout & grid](#5-layout--grid)
6. [Component primitives](#6-component-primitives)
7. [Motion & accessibility](#7-motion--accessibility)
8. [How future pages reuse this](#8-how-future-pages-reuse-this)
9. [Weather strip — `.weather…`](#9-weather-strip--weather-added-with-the-existenz-source)
10. [Event row — `.event…`](#10-event-row--event-added-with-the-eventfrog-source)
11. [Departure board — `.ov…`](#11-departure-board--ov-added-with-the-transport-source)
12. [Category filter — `.catfilter…`](#12-category-filter--catfilter-added-with-the-regensdorf-news-source)
13. [Section header & multi-section page — `.abfall…`](#13-section-header--multi-section-page--abfall-added-with-the-regensdorf-waste-source)
14. [Site chrome — `.site-header…` / `.site-foot…`](#14-site-chrome--site-header--site-foot-masthead--imprint)
15. [Dashboard «Heute» — `.dash-section…`](#15-dashboard-heute--dash-section-13-template-generalised)
16. [Page prose — `.page__prose`](#16-page-prose--page__prose-mandatory-info--legal-pages)

---

## 1. Rationale

**Concept: «Amtsblatt, neu gesetzt» — the municipal gazette, reset for the
screen.** regi is not an app and not a dashboard; it is a digital gemeindeblatt
with live data. The design therefore borrows from Swiss newspaper typography
and the grid discipline of Müller-Brockmann/Crouwel rather than from product
UI. Calm, dense, precise. The reader scans a column of official notices the way
they would scan a printed Amtsblatt.

Three decisions follow directly from the content reality:

- **The date is the sort axis, so it gets a fixed gutter, not a big number.**
  Items are ordered by `publishedAt`. The date sits in its own left-hand
  column, set in the monospace face with tabular figures so every date aligns
  to the pixel. It is *structurally* dominant (always first, always aligned)
  and *visually* quiet (small, muted). That is the brief's «dominant but not
  loud», solved with position instead of weight.
- **The title is reading content #1**, so it carries the only real typographic
  weight on the page (Geist 600, the largest body-level size, full-ink). German
  notice titles run long (real data up to ~120 chars); the title block is built
  to wrap and hyphenate gracefully, never truncate.
- **~30 % of items have no body.** The list-item layout is designed so a
  title-only entry looks like a deliberate one-line gazette record, not a
  broken card. There are no cards at all — cards imply equal-weight tiles; a
  gazette is a continuous ruled list.

**Source marker & external link.** Source disambiguation matters once
multi-source aggregation is live, so the source name is always shown as a quiet
meta label (no coloured pill — pills read as SaaS). The external link is the
one accented, glyph-marked affordance per item. Honest constraint: the
`publications` table has **no per-item deep-link column** yet, so on
`/amtliches` v1 the link points at the source homepage (`sources.url`). The
`External-Link` primitive is defined generically; when real ingestion adds a
per-item URL, only the `href` and label change — no design change.

**Colour — heraldic, editorial.** The Regensdorf coat of arms is gules (red)
with a white tower. No vector exists, so the accent is *derived* from that
heraldry rather than reproduced: a deep, desaturated brick red
(`#982f2c`), closer to NZZ editorial red / bordeaux than to a bright alert
red. It is an **accent only** — links and the external affordance — never a
flood. Neutrals are warm-tinted (paper, not paper-white; warm near-black ink,
not `#000`) so the whole surface reads like uncoated stock. This one decision
satisfies both the coat-of-arms anchor and the «warm, muted tone» fallback.

**Light first, dark deferred but structured.** CLAUDE.md §5/§10 want both modes
equal; this iteration deliberately ships light only (briefing override). Every
colour is a *semantic* token (`--ink`, `--accent`, …) referenced by name
nowhere as a raw value, and the dark palette exists as a commented, ready-to-
fill stub. Adding dark later means uncommenting one block — no component edits.
(This is a conscious deviation from CLAUDE.md §5; an ADR is recommended.)

---

## 2. Colour tokens

Warm-paper light palette. All values are semantic; components never reference a
raw hex. Defined in `app/globals.css` `:root`, exposed to Tailwind via
`@theme inline` (`bg-paper`, `text-ink`, `text-accent`, …).

| Token            | Light value | Role                                          |
|------------------|-------------|-----------------------------------------------|
| `--paper`        | `#faf8f4`   | Page background (warm off-white)              |
| `--surface`      | `#f1ece2`   | Raised panel — empty state                     |
| `--ink`          | `#1a1714`   | Titles, primary text (warm near-black)        |
| `--ink-muted`    | `#44403a`   | Body snippet                                   |
| `--ink-meta`     | `#736a5f`   | Date, source label, all meta                   |
| `--rule`         | `#ddd6c8`   | Hairline between notices                        |
| `--rule-strong`  | `#c3baa8`   | Masthead underline                              |
| `--accent`       | `#982f2c`   | Links, external affordance, selection          |
| `--accent-hover` | `#7c2522`   | Accent hover/active                             |

### Contrast (WebAIM formula, light mode)

| Pair                              | Ratio    | WCAG          |
|-----------------------------------|----------|---------------|
| `--ink` on `--paper`              | ≈ 16:1   | AAA           |
| `--ink-muted` on `--paper`        | ≈ 9:1    | AAA           |
| `--ink-meta` on `--paper`         | ≈ 5.0:1  | AA (normal)   |
| `--accent` on `--paper`           | ≈ 7:1    | AA / ~AAA     |
| `--accent` focus ring on `--paper`| ≈ 7:1    | AA non-text   |

The meta colour is the floor of the system at ≈5.0:1 — kept above the 4.5
threshold so even the smallest text (date, source) is AA at normal size.

### Dark mode (deferred — structured stub)

`app/globals.css` carries a commented `@media (prefers-color-scheme: dark)`
block with the same token names and placeholder values flagged
`TODO(dark): not yet contrast-verified`. Because components bind to the
semantic names only, enabling dark = uncommenting + tuning that one block.

---

## 3. Typography

One family: **Geist** (Sans for everything, Mono for the date), already loaded
via `next/font` in `app/layout.tsx` (`--font-geist-sans` / `--font-geist-mono`).
Geist is a neutral Swiss-adjacent grotesque — correct for a gazette, and the
only approved typeface. No display face: the hierarchy is built from weight,
size and the mono/sans contrast, Swiss-style, not from a decorative headline
font.

| Token         | Size            | Use                                   | LH   | Weight |
|---------------|-----------------|---------------------------------------|------|--------|
| `--text-xs`   | 0.75rem / 12px  | Source tag (uppercase, tracked)        | 1.4  | 500    |
| `--text-sm`   | 0.8125rem / 13px| Date (mono), external-link label       | 1.3  | 400/500|
| `--text-base` | 1rem / 16px     | Body snippet                            | 1.6  | 400    |
| `--text-lg`   | 1.0625rem / 17px| **List-item title** (reading content)  | 1.3  | 600    |
| `--text-xl`   | 1.5rem / 24px   | Page H1 (masthead)                      | 1.2  | 600    |

- Body measure capped at **62ch** for editorial readability.
- Titles: `letter-spacing: -0.01em`, `hyphens: auto`, `text-wrap: pretty`
  (German compounds wrap/hyphenate instead of overflowing).
- Source tag: `text-transform: uppercase`, `letter-spacing: 0.06em`.
- Date: `font-variant-numeric: tabular-nums` so every `TT.MM.JJJJ` aligns.
- The title is intentionally only 17px — one notch above body. A gazette earns
  hierarchy through rules, position and the mono date, not large type.

---

## 4. Spacing

4 px base grid. Tokens `--space-1 … --space-8`.

| Token | rem  | px | Typical use                              |
|-------|------|----|------------------------------------------|
| 1     | 0.25 | 4  | glyph nudge                               |
| 2     | 0.5  | 8  | tag ↔ link gap, mobile date ↔ title       |
| 3     | 0.75 | 12 | title ↔ body                              |
| 4     | 1    | 16 | body ↔ footer                             |
| 5     | 1.5  | 24 | **notice vertical padding**, gutter gap   |
| 6     | 2    | 32 | masthead ↔ list                           |
| 7     | 3    | 48 | page vertical padding                     |
| 8     | 4    | 64 | empty-state padding                       |

---

## 5. Layout & grid

- Page shell: `max-width: 48rem` (768px), centred, horizontal padding
  `--space-5`, vertical `--space-7`. Editorial single column.
- Each notice is a 2-column CSS grid:
  `grid-template-columns: 4.75rem 1fr; column-gap: --space-5;`
  baseline-aligned so the date's baseline meets the title's first line.
- Notices separated by a `--rule` hairline (`li + li`), not boxed.
- **Mobile (< 40rem):** grid collapses to one column; the date becomes a quiet
  mono meta line directly above the title (`row-gap: --space-2`). No other
  change — same primitives, same rhythm.

---

## 6. Component primitives

These four primitives + the page shell + empty state are the entire kit needed
for `/amtliches` and every future list page.

### List-Item — `.notice`
- **Semantics:** `<li><article>` inside `<ol class="notices">`.
- **Structure:** grid → [ `Time-Element` ] [ content column: `<h2>` title →
  optional `<p>` body → `<footer>` with `Source-Tag` · `External-Link` ].
- **Body present:** title → 12px → body (clamped to 3 lines, `line-clamp`, so
  the list rhythm holds; full text lives at the source) → 16px → footer.
- **No-body variant:** title → footer directly, with the footer gaining
  `margin-top: --space-3`. Reads as an intentional single-line gazette record.
- **States:** static (no hover on the row itself — the row is not a link;
  only the external link is interactive, which keeps the dense list calm).

### Time-Element — `.notice__date`
- **Semantics:** `<time datetime="<ISO>">`, machine-readable; visible text is
  `TT.MM.JJJJ` from the existing `Intl.DateTimeFormat("de-CH")`.
- **Style:** mono, `tabular-nums`, `--text-sm`, `--ink-meta`, `white-space:
  nowrap`. Lives in the fixed gutter (desktop) / as a meta line (mobile).
- Dominant by position + alignment, quiet by colour + size.

### Source-Tag — `.tag`
- **Semantics:** `<span>` (not a link — it disambiguates, it doesn't navigate).
- **Style:** uppercase, `--text-xs`, tracked `0.06em`, `--ink-meta`, weight
  500. No pill, no background. Renders only if a source name exists.
- **Future:** when multiple sources are live, an optional leading 0.5em accent
  square (`--accent`) per source may be added; the text label remains the
  primary disambiguator. Out of scope for v1 (single source).

### External-Link — `.ext`
- **Semantics:** `<a href rel="noopener noreferrer" target="_blank">` with a
  German `aria-label` naming the destination host and «(öffnet in neuem Tab)».
- **Style:** `--accent`, `--text-sm`, weight 500, label «Zur Quelle» + a
  trailing `↗` (U+2197, `aria-hidden`) marking it external. No icon asset.
- **States:** rest = accent, no underline; hover/focus = `--accent-hover` +
  underline (`text-underline-offset: 2px`); focus-visible = 2px accent outline,
  2px offset. Colour/underline transition guarded by reduced-motion.
- v1 `href = sources.url` (homepage). The primitive is URL-agnostic; a future
  per-item deep link only swaps `href` and the label («Mitteilung öffnen ↗»).

### Empty state — `.empty`
- `--surface` panel, `--space-8` padding, `--ink-muted`. Primary line
  «Keine Mitteilungen vorhanden.» + a quieter second line stating the list
  updates automatically. Designed, never a bare `<p>`.

### Page shell — `.page` / `.page__head`
- `<main class="page">` → `<header class="page__head">` with `<h1>` masthead
  («Amtliche Mitteilungen») and a `--ink-meta` count line («N Mitteilungen»),
  closed by a `--rule-strong` underline. Header/nav/footer chrome is explicitly
  **not** part of this system (separate task).

---

## 7. Motion & accessibility

- One restrained reveal: list items fade up 6px on load, short staggered
  `animation-delay` for the first 8 only (longer lists don't cascade). Pure
  CSS, opacity + tiny translate.
- Entire motion layer wrapped in
  `@media (prefers-reduced-motion: no-preference)`. With reduced motion the
  base state is fully visible — nothing is hidden behind an animation.
- Semantic HTML throughout (`main`, `header`, `h1/h2`, `ol/li`, `article`,
  `time`, `footer`). Keyboard: the only interactive element per row is the
  external link, fully tabbable with a visible accent focus ring.
- `::selection` uses `--accent` on `--paper` — a quiet brand touch.

---

## 8. How future pages reuse this

Presse, Veranstaltungen, ÖV, Statistik are all dated lists. They reuse
`.page`, `.notice`, `.notice__date`, `.tag`, `.ext`, `.empty` unchanged. New
content types add *fields within* the content column (e.g. an event time, a
price in CHF) using the existing tokens — they do not introduce new colour,
type or spacing scales. Any genuinely new primitive is added here first, then
used. The system is the contract; pages are instances of it.

---

## 9. Weather strip — `.weather…` (added with the Existenz source)

Not every source is a dated list. Current weather is a *state*, not a feed, so
it gets the first non-list primitive: a **print-broadsheet weather box**, not a
card. It still obeys the system — same tokens, same hairline rhythm, same
mono/sans voices — and reuses `.tag` / `.ext` / `.empty` unchanged.

- **`.weather`** — a block bounded by a single `--rule` hairline + `--space-6`
  bottom margin. On `/amtliches` it sits between the masthead and the notices
  `<ol>`; on `/wetter` it sits below the masthead. `.weather--empty` drops the
  frame so the reused `.empty` panel reads normally when there is no data.
- **`.weather__now`** — the primary reading line (flex, baseline-aligned):
  - **`.weather__temp`** — the figure, Geist **Mono**, `--text-xl` (the scale
    ceiling — no new token), `tabular-nums`, `--ink`. The temperature is the
    one large element; hierarchy comes from the mono *voice* + size, not from
    `--accent`. **Accent is never used for a value** — it stays links-only.
  - **`.weather__unit`** — small superior `°C` in `--ink-meta` (broadsheet
    figure/unit pairing).
  - **`.weather__desc`** — terse sans descriptor, `--ink-muted`, derived only
    from measured fields (no invented sky condition).
  - **`.weather__time`** — trailing mono `--ink-meta` stamp: a machine-readable
    `<time datetime>` (the SSR source of truth, formatted CH, `Europe/Zurich`
    pinned) plus a tiny `'use client'` `vor X …` augmentation that starts empty
    and fills post-mount (no hydration mismatch; absolute time stands without
    JS).
- **`.weather__params`** — secondary `<dl>` of figures (Feuchte, Wind+Böen,
  Luftdruck, Niederschlag): `dt` in the `.tag` voice, `dd` mono `tabular-nums`.
  **Hidden < 40rem** (same `39.99rem` breakpoint as the `.notice` gutter
  collapse): mobile shows only temp + descriptor + time by product decision.
- **`.weather__foot`** — `.tag` (mandatory «Quelle: MeteoSchweiz» attribution,
  legally required) + `.ext` external link, exactly like `.notice__foot`.
- **`/wetter` log** reuses `.notices` / `.notice` / `.notice__date` unchanged;
  only `.weather__logline` (one mono `tabular-nums` row per reading) and
  `.weather__colophon` (rule-topped attribution footer) are new. This keeps
  `/wetter` a visual sibling of `/amtliches`.

The strip is the template for any future *state* widget (ÖV live board, air
quality): a bounded block, mono figures, sans labels, accent links-only.

---

## 10. Event row — `.event…` (added with the Eventfrog source)

`/veranstaltungen` is a dated list, so it is **not** a new layout: each event
*series* is an instance of the `.notice` row, reused unchanged (grid, mono
date gutter, `.notice__title`, `.notice__foot`, the `regi-rise` reveal). Only
two event-specific lines are new, plus a page colophon.

- **Gutter** = the *next* occurrence's date in the existing `.notice__date`
  mono `--ink-meta` voice (TT.MM.JJJJ). The date gutter is **never** accent —
  accent stays links-only (a request to make it «Wappenrot» was resolved
  against the system: §2/§6 keep the gutter muted, exactly like `/amtliches`).
  The start *time* is not in the gutter (same rule as `/amtliches`); it sits
  in the meta line.
- **`.event__meta`** — a quiet `--ink-meta` line under the title: the start
  time in the mono data voice (`.event__time`, `tabular-nums`) then, on
  desktop, place and organizer in sans, `·`-separated (`.event__sep`,
  `--rule-strong`, the `.notice__sep` look). `.event__where` (place +
  organizer) is **hidden < 39.99rem** — mobile keeps title + next date + time
  + series, mirroring how the weather strip drops `.weather__params`.
- **`.event__series`** — the staffelung sub-line, mono `tabular-nums`
  `--ink-meta`, subordinate to the title. Rendered only when a series has
  occurrences beyond the next one; phrasing scales with how a reader thinks
  about cadence, not raw counts: 1 → «1 weiterer Termin am TT.MM.»; 2–10 →
  «N weitere Termine bis TT.MM.»; >10 → «Wiederkehrend bis TT.MM.» (never
  «Tagesserie» — the cadence is not known, so the word must not over-claim).
- **`.event__colophon`** — the rule-topped page attribution footer (`.tag`
  «Quelle: Eventfrog» · `.ext`), identical in shape to `.weather__colophon`.
  Two namespaced colophons now exist; a shared `.colophon` primitive is the
  obvious next generalisation but is deliberately **not** an en-passant
  refactor (CLAUDE.md §9) — recorded here as a known, intentional duplication.

One source-native id (`events.group_id`, ADR 0012 amendment) drives the
one-card-per-series collapse: ~150 raw occurrences render as ~10 rows. The
ungrouped (`group_id` NULL) events appear individually. This is the template
for any future *grouped* list (e.g. a recurring-meeting agenda).

---

## 11. Departure board — `.ov…` (added with the Transport source)

Live departures are **columnar data**, not a feed, so this is the first
deliberate non-list, non-strip primitive: a real semantic `<table>`. It still
obeys the gazette grammar — horizontal hairlines only (no vertical rules, no
cell borders), mono figures, sans prose, accent links-only.

- **Semantics first.** `<table>` with a `.sr-only` `<caption>` (the table's
  accessible name) and `<th scope="col">` headers in the quiet `.tag` voice.
  `.sr-only` is a new **a11y utility** (the standard clip pattern) — not a
  visual token; it also serves the future skip-link.
- **`.ov`** — `table-layout: fixed`: the four mono columns (`.ov__c-line`,
  `.ov__c-time`, `.ov__c-delay`, `.ov__c-plat`) have fixed widths so figures
  align to the pixel (`tabular-nums`); Ziel takes the remainder and wraps
  (`overflow-wrap: anywhere`, `hyphens: auto`) so long German destinations
  never overflow. Rows separated by a `--rule` hairline, last row clean; the
  header underlined with `--rule-strong` like `.page__head`.
- **Delay is typographic, never chromatic.** The system is monochrome-warm and
  `--accent` is links-only (§2); a yellow/green traffic-light was explicitly
  rejected. Lateness is signalled by **ink weight**: on-time/unknown is a
  quiet `--ink-meta` `--text-xs` («pünktlich» / «—»); a real delay is
  `.ov__delay--late` — `+N′` in full `--ink`, weight 600, `--text-sm`.
  Heavier ink = the alarm. This keeps the board readable as a gazette, not a
  dashboard, and stays WCAG-robust without relying on colour to convey state.
- **`.ov__status`** — the freshness line. `aria-live="polite"` wraps **only**
  the absolute `<time>` (`.ov__stamp`, mono), which changes on the real 60 s
  refresh; the 10 s-ticking «· vor X Sek.» (`.ov__rel`) is the aria-hidden
  client child — a ticking counter in a live region is SR noise (same
  trade-off as the weather `RelativeTime`).
- **`.ov__colophon`** — same rule-topped footer shape as
  `.weather__colophon`/`.event__colophon` (a third namespaced instance;
  the shared-`.colophon` generalisation remains the noted, deliberate
  not-en-passant refactor), plus a quiet `.ov__live` «Live, auf Abruf» note
  (the on-demand marker, ADR 0011).
- **Mobile < 39.99rem** drops the platform column only (`.ov__c-plat`),
  mirroring how `.weather__params` / `.event__where` shed secondary data at
  the same breakpoint; line · destination · time · delay remain.

This is the template for any future *real-time tabular* source (traffic, air
quality grids): a semantic table, mono columns, state by weight not hue,
on-demand (ADR 0011) with a `.sr-only` caption and an `aria-live` freshness.

---

## 12. Category filter — `.catfilter…` (added with the regensdorf-news source)

`/gemeinde` is one source (`regensdorf-news`, ADR 0013) carrying two source
categories (`pressemitteilungen`, `news`). It needs a facette — and the brief
called it a «Pill-Filter». A literal pill (chip, fill, radius) is forbidden
by §1 (no cards) and §6 («pills read as SaaS»). The control is therefore
**not** a pill: it is a **gazette index rail**, the same move §9–§11 make —
take the new requirement and re-set it in the existing grammar instead of
importing a product-UI component.

- **Voice.** Each option is the quiet uppercase tracked `.tag` voice
  (`--text-xs`, weight 500, `0.06em`, `--ink-meta`) — the page's existing
  meta register (source tags, `<th>` headers). The filter therefore reads as
  a *section index*, like the rubric labels atop a printed Amtsblatt, not as
  buttons. The count rides in the **mono `tabular-nums` data voice**
  (`--ink-meta`) — the same mono/sans pairing as date-gutter vs title, figure
  vs unit. A figure is never set in `--accent` (the §9 rule): the count stays
  `--ink-meta` even inside the accent-coloured active option.
- **Selection is the sanctioned accent role.** §2's token table lists
  `--accent` as «Links, external affordance, **selection**». A chosen facette
  *is* selection — categorically different from `/ov`'s delay, which is data
  *state* and is therefore weight-not-hue (§11). So accent here is on-system,
  not a §11 violation: a selected facette behaves like a selected link, not
  like a coloured status. To stay robust without relying on hue alone,
  selection is **triple-encoded**: `--accent` colour **+** weight 600 (the
  §11 emphasis device) **+** a 2px `--accent` bottom rule. The underline is a
  *horizontal* hairline — the only rule grammar the system allows (§11: no
  vertical rules, no boxes). The 2px border is reserved transparent on every
  state so activating a facette never shifts the row.
- **Affordance split.** Inactive hover darkens toward full `--ink` (signals
  «interactive») — deliberately *not* accent, because accent is reserved for
  the selected facette and for links. Focus reuses the global 2px accent
  `:focus-visible` ring unchanged. The options are real `<Link>`s, not client
  buttons: the facette is pure URL state (CLAUDE.md §4), so Cmd/middle-click,
  prefetch, keyboard and shareability come for free and `/gemeinde` ships
  **zero client JS** (the list is a pure RSC that re-renders server-side on
  navigation; the active value is parsed by the nuqs server loader). Selection
  is also exposed as `aria-current="page"` (a third, non-visual encoding).
- **Frame & rhythm.** The block is hairline-bounded exactly like `.weather`
  (`--rule` bottom, `--space-4` pad, `--space-5` margin), sitting between the
  `.page__head` (`--rule-strong`) and the `.notices` list — the same
  masthead → ruled control → list cadence the weather strip established.
- **Mobile.** The rail scrolls horizontally (no wrap, hidden scrollbar)
  rather than stacking — mirroring how `.weather__params` / `.event__where`
  / `.ov__c-plat` shed/relayout secondary chrome at the same `39.99rem`
  breakpoint. The reserved transparent underline keeps it shift-free.
- **Motion.** Only a `color 0.15s` transition, unguarded — identical to
  `.ext`. The rail does **not** take the `regi-rise` reveal: a filter must be
  usable the instant the page paints, not animate in.

`.gemeinde__colophon` is the page attribution footer, the same shape as
`.weather__colophon` / `.event__colophon` / `.ov__colophon`. A fourth
namespaced instance — the shared `.colophon` generalisation remains the
documented, deliberate not-en-passant refactor (CLAUDE.md §9).

This is the template for any future *facetted single-source list* (e.g. a
press-category or rubric filter): the `.tag`-voice index rail, selection as
the sanctioned accent role triple-encoded, hairline-bounded, never a pill.

---

## 13. Section header & multi-section page — `.abfall…` (added with the regensdorf-waste source)

`/abfall` is the first page that is **not** a single list: it stacks two
sections — «Nächste Abfuhren» (the computed weekly rules, Fork 5) and
«Kommende Spezialtermine» (the ingested dated collections) — plus the §12
`.catfilter` rail reused unchanged for the Tour facette. Multiple sections
risk becoming cards/panels; §1 forbids that. Solved as a printed-Amtsblatt
**rubric break**, not a panel.

- **Section head = a lighter masthead.** `.abfall__sectionhead` mirrors the
  `.page__head` structure exactly — text, a bottom rule, a bottom margin —
  but every weight is stepped down: the light `--rule` hairline (not
  `--rule-strong`), `--text-lg` (not the masthead `--text-xl`), no extra
  weight token (the global `h1,h2` 600 carries it). The reader gets an
  unambiguous three-level hierarchy — masthead `>` rubric `>` row — built
  from rule strength + size, Müller-Brockmann style, with **zero** box,
  border, background or shadow. The `.weather__loghead` `--text-lg` sub-head
  (§9) is the precedent this generalises.
- **One continuous column.** Sections are separated only by vertical space
  (`.abfall__section + .abfall__section` → `--space-7`); the first sits
  naturally below the `.catfilter` rule. Nothing encloses a section, so two
  stacked sections still read as one calm gazette page scrolling down, not as
  two tiles. Rows inside are the `.notice` primitive reused unchanged (mono
  date gutter, `h3` `.notice__title` under the section's `h2` — correct
  heading order), so a section is just a titled stretch of the same ruled
  list.
- **`.abfall__sectionnote`** («nächste 30 Tage») is a qualifier, not a
  heading: the quiet uppercase-tracked `.tag` register, baseline-aligned
  beside the rubric title — a dateline on the rubric, never competing with
  it.
- **`.abfall__meta`** is the quiet sub-line under a `.notice__title`,
  reusing the `.event__meta` grammar verbatim (`--ink-meta`, `--text-sm`,
  baseline flex, `·`-separated). `.abfall__weekday` is one notch up
  (`--ink-muted`): the human scan-target — «Freitag» — paired with the
  machine-precise mono date in the gutter; still quiet, never accent.
- **Holiday move = ink weight, not hue.** When the Grüngut-Tour-Süd
  Montag→Mittwoch exception fires, the row carries `.abfall__shift`
  («verschoben (Feiertag)») in weight 600 full `--ink` — the single heavier
  element on an otherwise `--ink-meta` line. This is the §11 `.ov__delay--late`
  precedent applied unchanged: an exception is signalled by heavier ink, never
  by colour; `--accent` stays links/selection only.
- **`.abfall__colophon`** is the page attribution footer, identical in shape
  to `.weather__/.event__/.ov__/.gemeinde__colophon` — a fifth namespaced
  instance; the shared `.colophon` generalisation remains the documented,
  deliberate not-en-passant refactor (CLAUDE.md §9).

This is the template for any future *multi-section* page (a future
dashboard-style overview, a combined service page): rubric breaks not cards,
`.notice` lists reused under stepped-down heads, exceptions by weight.

---

## 14. Site chrome — `.site-header…` / `.site-foot…` (masthead & imprint)

§6 deferred header/nav/footer as "explicitly **not** part of this system
(separate task)". This is that task. Chrome is global and persistent — on
every page, owned by `app/(public)/layout.tsx`, not by any page — so it is
documented apart from §1–§13, **but obeys the same gazette grammar**: one
Geist family, the warm monochrome tokens, hairlines only, no
box/card/pill/shadow, accent links/selection-only. It is the printed
gazette's *masthead* and *imprint* reset for the screen, not an app bar.

### Information architecture: a flat 7-rubric nav, no dropdown

The nav is a flat list in a fixed, meaningful order:
`Heute · Amtliches · Gemeinde · Veranstaltungen · Wetter · ÖV · Abfall`.
Four reasons it is flat, not a «5 + Mehr ▾» disclosure:

1. **Frequency.** Wetter, ÖV and Abfall are the most-consulted routes (a
   resident checks departures and the bin day far more often than official
   notices). Hiding the highest-traffic rubrics behind a dropdown inverts
   the IA. «≤5 top-level items» is a SaaS heuristic, not an editorial one.
2. **Reference class.** The model is a Swiss newspaper masthead (NZZ/FT
   carry 10–12 ressorts flat), not a product top-bar. Seven rubrics fit
   comfortably within the 48rem measure — verified, not assumed.
3. **§9 discipline.** A dropdown would be the *first* disclosure primitive
   in the whole system (hover/click/escape/focus, a client island)
   introduced only to hide three links. «Wenig Code, der viel tut».
4. **Cluster via order, not submenu.** The two natural groups — civil/
   editorial (Heute, Amtliches, Gemeinde, Veranstaltungen) and everyday
   service (Wetter, ÖV, Abfall) — are expressed by *adjacency and
   sequence*, the gazette's own rubric-index device. Exactly the §9–§13
   move: re-set the requirement in the existing grammar instead of
   importing a product component. The flat ordered nav *is* the section
   index of a printed gazette.

`NAV_ITEMS` is the single source of truth — the desktop nav and the
Phase-5 mobile drawer both render from it, so the two cannot drift.

### Active state: ink weight for chrome — the reasoned §12 divergence

The current rubric is `aria-current="page"` + **weight 600 + full
`--ink`** — the §11 emphasis device (`.ov__delay--late`,
`.abfall__shift`), **never `--accent`**. §12 `.catfilter` resolves an
apparently identical case (a selected `<Link>` with `aria-current="page"`)
the *opposite* way — accent-as-selection, triple-encoded. The divergence is
principled, and defines a rule future components inherit **by class of
control**:

- **In-page selection** (a filter scoped to one page, transient,
  contextual — §12): selection is the sanctioned accent role (§2 token
  table: «Links, external affordance, **selection**»). Accent is rare and
  local.
- **Global chrome** (the masthead, persistent on every page, cross-page):
  accent here would be a **flood** — exactly what §2 forbids («an accent
  only — never a flood»). State is carried by ink weight + the non-visual
  `aria-current="page"` (a large `--ink-meta`→`--ink` darkness delta plus
  weight — robust without colour, WCAG 1.4.1).

Header nav links and footer legal links share **one** non-accent
chrome-link grammar: `--ink-meta`, hover darkens to `--ink` (the §12
affordance-split — hover is *not* accent), focus reuses the global 2px
accent `:focus-visible` ring. Accent therefore stays
links/external/in-page-selection-only across the entire surface.

### Masthead composition

- **Wordmark** (`.site-header__mark`, a link to `/`): the list-title voice
  — `--text-lg` / 600 / `-0.01em`, **no new token**. Structurally dominant
  (fixed top-left, persistent, under the strong masthead rule) yet visually
  quiet — deliberately *not* `--text-xl`, so each page's own H1 stays the
  largest element on that page (content-first; chrome recedes). The §1
  «dominant by position, quiet by size» reasoning, applied to the
  nameplate. Hover = underline + 2px offset (the `.ext` device, non-accent).
- **Nav** (`.site-nav__link`): the quiet uppercase-tracked `.tag` register
  (identical to `.catfilter__opt`) — a rubric index, not a button bar.
  `--space-2` block padding lifts every rubric to a ≥24px pointer target
  (WCAG 2.5.8) while `--space-3` band padding keeps the masthead a calm
  strip.
- **Sticky, zero-JS, no shadow.** `position: sticky; top: 0` with an opaque
  `--paper` background and the permanent `--rule-strong` masthead rule (the
  rule `.page__head` already uses). Content scrolling beneath is separated
  by the opaque band + rule — no scroll listener, no elevation, no
  translucency/blur (a SaaS glass device). The header stays an RSC; only
  `SiteNav` ships JS (an `aria-current` resolver via `usePathname` — Next 16
  has no server pathname, by design; verified against the docs).
- **Skip link** first in the DOM (WCAG 2.4.1), revealed by `transform`
  (never an animated layout property), targeting `#inhalt` — a
  `tabindex=-1` wrapper, **not** a `<main>` (each page owns its
  `<main className="page">`; a layout-level `<main>` would duplicate the
  landmark). `.site-main:focus { outline: none }` is retained deliberately:
  the GOV.UK skip-target pattern — the indicator is the skip link's *own*
  visible focus + the content reveal + correct subsequent tab order; a 2px
  ring around the entire content region would be worse UX. Documented here
  so it is not mis-read as the `outline-none`-without-replacement
  anti-pattern.
- **Mobile (< 39.99rem):** wordmark + burger. The §14 «no burger this
  phase» placeholder is **resolved in Phase 5** by the atomic burger +
  off-canvas drawer (see «Mobile drawer» below). Both render from the same
  `NAV_ITEMS` constant — the desktop nav and the mobile drawer cannot
  drift, by construction.

### Mobile drawer — `.site-burger…` / `.site-drawer…` (Phase 5 atomic ship)

The burger trigger sits inline-right of the wordmark below 39.99 rem and
opens an off-canvas drawer that slides in from the right, capped at
`min(22rem, 80vw)` so it never feels stretched on tablets. The same
NAV_ITEMS render in the drawer with the same active-rubric grammar — ink
weight + `--ink` + `aria-current="page"`, **never accent** (§14 carries
to the drawer verbatim).

- **Burger visual** — a three-bar ≡, animating to an X-cross when open
  (outer bars rotate 45°, middle fades). `currentColor` lets the bars
  inherit `--ink`. Reduced-motion drops the spin.
- **Backdrop tint** — the only place the system tints `--ink` with
  opacity, via `color-mix(in srgb, var(--ink) 38%, transparent)`. **Not
  a new token** — a compositional derivation of the existing `--ink`.
  Modal-dialog convention; `aria-hidden` so SRs never read it. The
  backdrop is the click-outside-to-close target.
- **Drawer chrome** — `--paper` background; **no border or shadow** —
  the dimmed backdrop is the visual separator (the system has no
  vertical rules, §11; a dropshadow would be SaaS-elevation, §1
  pressure). `100dvh` height so the browser chrome doesn't clip, and
  safe-area padding so notches are honoured.
- **Drawer links** — the §14 nav `.tag` voice (`--text-xs`, 500,
  uppercase, `0.06em`, `--ink-meta`), with `padding-block: --space-3`
  so each tap target is well above the WCAG 2.5.8 24 px floor (≥44 px
  on phone, iOS standard). Active rubric is ink-weight, never accent.
- **Mandatory legal links** sit at the bottom of the drawer in their
  own footer block, hairline-separated by a horizontal `--rule` (a
  conventional rubric break, *not* a vertical column rule).
- **A11y discipline (mandatory):**
  - `role="dialog"` + `aria-modal="true"` + `aria-label="Hauptnavigation"`
    on the drawer
  - `aria-expanded` + `aria-controls` on the burger, label flips
    «Navigation öffnen» / «Navigation schliessen»
  - DIY focus-trap with `useEffect` — Tab/Shift+Tab wraps inside the
    drawer. No npm focus-trap library: the orchestrator pre-decision
    explicitly rejected one as over-engineering for a single component.
  - Escape closes; outside-click on the backdrop closes; route change
    (`pathname`) closes; close returns focus to the burger.
  - First drawer link focused on open (`requestAnimationFrame` deferral
    so the visibility transition has applied).
  - Body scroll-lock while open (`overflow: hidden` on `document.body`,
    restored on close).
  - `aria-hidden` on the drawer when closed and `tabIndex=-1` on its
    links — belt-and-suspenders with the CSS `visibility: hidden`
    transition.
- **z-index** — drawer 60, backdrop 50, header 10, skip-link 20.
  Adding two literals (50, 60) to the existing `10` / `20` is on the
  §14 "single z-index sticky layer" discipline — concrete values, no
  z-scale token system invented for one modal layer.

### Footer: a gazette imprint, not a megafooter

`.site-foot` is the imprint line of a printed gazette: a quiet,
left-aligned, **single-column** block, identical at every breakpoint (no
split bar to reflow — a split footer is a SaaS pattern). A `--rule-strong`
top rule **bookends** the masthead's `--rule-strong` bottom rule, so page
content sits in a bounded gazette column. Lines, in reading order: tagline
(`--ink-muted`); the shortened source attribution, which cross-references
«Quellen» by name **link-free** (the actual Quellen link is in the
legal-links row, not duplicated; the full licensed source list is
auto-generated on `/quellen`, Phase 4); the mandatory legal links
(`Quellen · Impressum · Datenschutz · Kolophon`, middot separators in
`--rule-strong` as decorative generated content) in a labelled
`<nav aria-label="Rechtliches">`; and the copyright. Footer links use the
shared chrome-link grammar — non-accent, so the register that opens the
page is the register that closes it.

### Token discipline

§14 introduces **no new token** — not a colour, type size, weight, or
spacing step. Wordmark = `--text-lg`/600; nav = the `.tag` register;
everything else is existing `--ink-*` / `--rule*` / `--space-*`. The only
literals are a single `z-index: 10` (one sticky layer; a z-scale would be
over-engineering for one element) and `env(safe-area-inset-*)` guards on
the full-bleed sticky inner padding (WIG Safe Areas). No `regi-rise` reveal
on chrome: like `.catfilter`, chrome must be usable the instant the page
paints (the only motion is the established unguarded `color 0.15s` link
transition and the skip link's reduced-motion-guarded `transform`).

This is the template for any future *global chrome* (a command bar, a
site-wide banner): obey the per-page gazette grammar, carry state by ink
weight not accent, introduce no new token, stay RSC except for the smallest
necessary client island.

---

## 15. Dashboard «Heute» — `.dash-section…` (§13 template, generalised)

`/` is the gazette **front page**. §13 named this exact use ("the
template for any future *multi-section* page (a future dashboard-style
overview…)"). §15 is that template realised — not a new aesthetic.
ADR 0014 records the system-level reasoning behind the one decision
that defines the page: **one continuous column at every breakpoint**.

### Why single-column (the resolved fork)

The Phase-3 brief pre-specified a desktop 2-column grid for the
medium-priority editorial trio. That arrangement cannot live inside
the system without breaking three of its own laws — §11 forbids
vertical rules (a column reading needs one); §1 / §13 forbid tile
layouts; halving the 48 rem shell starves the `.notice`
`4.75rem 1fr` grid and the 62 ch title-measure. The system's repeated
move (§9–§14) is "re-set the requirement in the existing grammar",
and the existing grammar for many sections **is** §13. The dashboard
is that, scaled — six rubric-broken sections in one calm column,
mobile and desktop alike. The reused primitives (`.notice`,
`.weather`, `.ov`) already self-collapse at 39.99 rem; §15 adds **no
new breakpoint logic of its own**. Full reasoning + reversal path:
ADR 0014.

### The `.dash-section` primitive

A new namespace, on the established per-feature precedent
(`.weather__`, `.event__`, `.ov__`, `.gemeinde__`, `.abfall__`). The
§13 `.abfall__sectionhead` structure **generalised** — same shape, no
waste-specificity, **zero new tokens** (the §14 discipline verbatim).

- **`.dash-section`** — the section frame. No border, no background,
  no padding of its own; sections separated only by vertical space
  (`.dash-section + .dash-section { margin-top: --space-7 }`).
- **`.dash-section__head`** — the lighter masthead, stepped down from
  `.page__head` exactly as `.abfall__sectionhead` is: light `--rule`
  (not `--rule-strong`), `--text-lg` (not `--text-xl`), global
  `h2`/600 — Müller-Brockmann hierarchy by rule strength + size, with
  zero box. Baseline-aligned flex row pushes "Alle anzeigen →" to the
  far end (the editorial section-jump device, not a SaaS split bar).
  On a narrow screen `flex-wrap` drops the link beneath the title —
  honest, no extra breakpoint.
- **`.dash-section__title`** — `--text-lg`/600. `scroll-margin-top`
  keeps a deep-linked rubric off the viewport edge (§13 / WIG).
- **`.dash-section__note`** — the quiet qualifier ("nächste 7 Tage",
  "Bahnhof Regensdorf-Watt"). The `.tag` register verbatim: `--text-xs`
  / 500 / uppercase / `0.06em` / `--ink-meta`. Direct reuse of the
  `.abfall__sectionnote` grammar.
- **`.dash-section__more`** — the «Alle anzeigen →» control. The §14
  **chrome-link grammar** (the §12 affordance-split applied): a
  `.tag`-register `<Link>` — `--text-xs` / 500 / uppercase / `0.06em` /
  `--ink-meta`, hover darkens to `--ink` (interactive, **not** accent),
  `padding-block: --space-2` for the ≥24 px pointer target
  (WCAG 2.5.8, the §14 nav-link precedent), `transition: color 0.15s
  ease`. The trailing `→` (U+2192, `aria-hidden`) is the same-site
  analog of `.ext`'s external `↗` — **ink not accent because the
  destination is internal**. §2 reserves accent for
  `links / external / in-page-selection` only; a section-jump link is
  none of those, so it must not spend the accent budget. Real `<Link>`
  (prefetch, keyboard, shareability — the §12 precedent); distinct
  visible label per section, and the rubric `<h2>` contextualises the
  link via `aria-labelledby` (WCAG 2.4.4 in-context).
- **`.dash-section__empty`** — the section-scoped empty / loading line.
  A one-line `--ink-meta` paragraph at `padding-block: --space-5` —
  held layout height, never an omitted block. Inline, **not** the
  `--surface` `.empty` panel (a panel between ruled sections would
  read as the forbidden tile, §1). The full-page `.empty` panel stays
  for whole-page-empty cases on the dedicated routes.
- **`.dash-section__empty-hint`** — the optional second line, the
  `.empty__hint` voice (`--text-sm` / `--ink-meta`).

### Section order, content & hierarchy

Masthead = `<h1 class="page__title">Heute</h1>` + a `.page__meta`
**full dateline** computed `Europe/Zurich` at request time
("Dienstag, 19. Mai 2026"). The dateline is the gazette masthead's
own device — same `.page__meta` slot `/abfall` uses for "Stand: …",
same mono `--ink-meta` voice, **no new token**.

Then six stacked `.dash-section`s, ordered by the §14 IA logic
(everyday-service frequency first, editorial after):

| # | Rubric          | Body (reused unchanged)                                                  | Note                    | More →                                     |
|---|-----------------|--------------------------------------------------------------------------|-------------------------|--------------------------------------------|
| 1 | Wetter          | `<WeatherWidget data={getWeather(1)}>`                                   | —                       | Zur Wetterseite → `/wetter`                |
| 2 | Abfahrten       | condensed `<DepartureBoard>` (~5 rows, **no `<LiveRefresh>`**)           | Bahnhof Regensdorf-Watt | Alle Abfahrten → `/ov`                     |
| 3 | Abfall          | `.notice` rows with `.abfall__meta` — regular + special, **7-day** horizon | nächste 7 Tage        | Abfallkalender → `/abfall`                 |
| 4 | Amtliches       | newest **3** `.notice` rows — title-only, quiet `.tag` source label       | —                       | Alle amtlichen Mitteilungen → `/amtliches` |
| 5 | Gemeinde        | newest **3** `.notice` rows — title-only                                  | —                       | Alle Gemeinde-Mitteilungen → `/gemeinde`   |
| 6 | Veranstaltungen | next **3** `.notice` rows + `.event__meta` (time · place)                 | —                       | Alle Veranstaltungen → `/veranstaltungen`  |

### The dashboard is accent-free — and that is the point

Sections 4–6 are deliberately title-only: no body clamp, **no per-row
external `↗` link**. Repeating an accent affordance on 9 medium-
priority rows would violate §2 ("an accent only — never a flood").
The section's single non-accent "Alle anzeigen →" is the only jump
affordance. §1 explicitly designed the title-only `.notice` as a
first-class "deliberate one-line gazette record" — the dashboard is
its ideal use. The net effect: a front page essentially free of
`--accent`. A printed-index voice, not a product surface. Click
through to the dedicated route for bodies, bounded per-row external
links, live refresh, facette filters, and full page colophons.

### Loading & empty states

Each section owns its own `<Suspense>` boundary. The rubric head
renders immediately while the items area suspends with a
`.dash-section__empty` "Wird geladen …" line at consistent height —
no spinner, no shimmer (system has exactly one motion, `regi-rise`).
Empty copy stays terse and non-redundant ("Keine … in den nächsten
Tagen.") because the always-present head `more →` already carries the
route reference. Layout height is held in every state — a missing
block would be a layout jump, against the §13 consistent-column
discipline.

### Mobile vs desktop

Identical structure at both. The reused primitives self-collapse at
39.99 rem (`.notice` gutter → meta line, `.weather__params` hidden,
`.ov__c-plat` hidden); the dashboard adds only `flex-wrap` on
`.dash-section__head` so "Alle anzeigen →" can drop beneath the title
on narrow screens. **No new breakpoint logic** — the responsive
surface is already in the system the dashboard composes from.

This is the template for any future *front-page index* (a combined
homepage with more sources, a press archive overview, a service hub):
the §13 rubric-break grammar generalised, primitives reused
unchanged, accent absent, single column, **no new token**.

### Composition overrides

Standalone primitives may carry their own closure chrome (e.g.
`.weather`'s `padding-bottom` + `border-bottom` + `margin-bottom`) that
becomes redundant inside a composition like `.dash-section` — the
section's next-rubric hairline + the `--space-7` gap already provide
the separator, and the doubled rule reads as the §1-forbidden
card-frame. Such redundancies are reset **at the composition level**,
not mutated in the primitive. The standalone primitive must remain
portable to other contexts (`/amtliches`, `/wetter`). See the
`.dash-section .weather` reset in `app/globals.css` §15.

### Deferred refactor — the `.row__meta` grammar

The `.abfall__meta` rule (§13) is now reused on Amtliches and Gemeinde
editorial rows within the dashboard, making the dashboard the **third
instance** of the same byte-identical grammar (alongside `.event__meta`
in §10's `.colophon`-style deferral). Generalisation to a shared
`.row__meta` primitive is the correct path but is **deliberately
deferred** — not en passant in this PR (CLAUDE.md §9). The hidden
coupling (a future waste-only tweak to `.abfall__meta` would silently
change editorial rows) is acknowledged. Refactor when the fourth
instance arrives or when one source needs its meta-row to diverge.

---

## 16. Page prose — `.page__prose` (mandatory info / legal pages)

The mandatory Phase-4 pages — `/quellen`, `/impressum`, `/datenschutz`,
`/kolophon` — are flowing prose with sub-heads and labelled fields,
not dated lists. The `.notice` grammar built for the data feeds doesn't
fit: there is no date axis to put in the gutter and the content type is
free text, not a record. §16 introduces the smallest possible **prose
primitive** that lets these pages render at gazette quality while
introducing **zero new tokens**.

### Why a new primitive (vs. raw semantic HTML)

The system's global `body { font-size: 1rem; line-height: 1.6 }` styles
paragraphs correctly out of the box, but it does **not** size `<h2>`
sub-heads (the global `h1, h2 { font-weight: 600; line-height: 1.2 }`
rule omits size). A raw `<h2>` would inherit browser-default (~1.5em),
which lands almost exactly on `.page__title` — wrong hierarchy on a
page where the H1 must dominate. `.page__prose` provides the stepped-
down sub-head voice (`--text-lg`, the same step §13's
`.abfall__sectionhead` uses) without re-styling every page.

### What `.page__prose` does

It composes **with** `.page` (which provides the 48 rem shell and
padding) and styles its **direct content**:

- **Stack rhythm** — `> * + *` gets `margin-top: --space-4`, so
  paragraphs, lists, definition lists and sub-heads all step down
  rhythmically without per-element margin tuning.
- **`h2` sub-head** — `--text-lg`, `letter-spacing: -0.01em`, the
  stepped-down rubric voice. No bottom rule (these are flowing prose
  pages, not multi-section gazette pages — no rubric break is needed).
  `scroll-margin-top` so a deep-linked sub-head stays off the viewport
  edge (§13 / WIG precedent).
- **`p`** — `--ink-muted` body colour, `max-width: 62ch` (the §3
  editorial measure cap reused, so legal paragraphs don't drift
  uncomfortably wide on desktop).
- **`a`** — accent link in the `.ext`-grammar: rest accent, no
  underline; hover/focus accent-hover + underline at 2 px offset.
  Mandatory pages legitimately link to external destinations
  (mailto:, github, license URLs), which is exactly the `.ext` role.
  No `↗` glyph here — these are prose links inside a sentence, not the
  standalone external affordance per row that `.ext` is built for; the
  underline-on-hover carries enough wayfinding. Accent is therefore
  used on these pages, on purpose (vs. its absence on the dashboard) —
  links are precisely §2's primary sanctioned accent role.
- **`dl`** — a two-column grid (`9rem 1fr`, `--space-5` column-gap,
  `--space-3` row-gap, `max-width: 62ch`) for labelled fields like
  `Verantwortlich` / `Kontakt` / `Rechtsform`. `dt` speaks in the
  `.tag` register (uppercase, tracked, `--ink-meta`); `dd` is body in
  `--ink-muted`. The `dl` collapses to a single-column label-stack at
  `39.99rem` — same breakpoint as every other gutter-collapse in the
  system.

### What `.page__prose` doesn't do

- No new colour, type-size, weight, or spacing token.
- No rubric-break sections (`.dash-section`'s job).
- No `.notice` row chrome (gutter, hairlines between items).
- No "Stand: …" stamp class — the existing `.page__meta` voice (mono,
  `--text-sm`, `--ink-meta`) is reused inline for legal-text revision
  dates, the same way `/abfall` uses it for "Stand: TT.MM.JJJJ".

### Per-page composition

- **`/quellen`** — `.page__prose` wraps only the intro paragraph; the
  source list itself is the existing `.notices` / `.notice` primitive
  (sources are a *list*, not prose). One `.page__meta` "Stand: …"
  stamp at the foot if needed; the per-row `last_synced_at` covers
  most of it.
- **`/impressum`** — `.page__prose` with one paragraph and one `<dl>`
  (Verantwortlich, Kontakt, Rechtsform); a `.page__meta` "Stand: …"
  stamp at the bottom.
- **`/datenschutz`** — `.page__prose` with two or three `<h2>`
  sub-heads, paragraphs, one or two prose-`<a>` links. `.page__meta`
  "Stand: …" stamp.
- **`/kolophon`** — `.page__prose` with sub-heads, paragraphs and a
  `<dl>` (Tech, Code, Design, Lizenzen). `.page__meta` "Stand: …"
  stamp.

This is the template for any future *long-form text* page (an article,
a release note, a static FAQ): wrap content in `.page__prose`, use
semantic HTML, reuse tokens, **no new step**.
