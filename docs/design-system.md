# Design System – regi

> Produced by `/frontend-design` (CLAUDE.md §5, ADR 0003) against the live
> `/amtliches` page with real (mock) content. This is the **master template**:
> every future list page (Presse, Veranstaltungen, ÖV, Statistik) reuses the
> tokens and primitives defined here. Tokens live in `app/globals.css`; this
> document is the rationale and the contract.

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
