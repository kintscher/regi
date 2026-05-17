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
