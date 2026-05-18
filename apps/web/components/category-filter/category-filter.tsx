import Link from "next/link";
import { type Category, KATEGORIE_KEY } from "./parser";

/**
 * Category facette for /gemeinde. A Server Component by design: the facette is
 * pure URL state (CLAUDE.md §4) so it is a set of real <Link>s, not client
 * buttons — Cmd/middle-click, prefetch, keyboard and shareability come for
 * free, and /gemeinde ships zero client JS (the list stays a pure RSC that
 * re-renders server-side on navigation). `active` is the value the page parsed
 * via the nuqs server loader; counts are computed over the full cached set so
 * they reflect the source totals, not the filtered view.
 */
export function CategoryFilter({
  active,
  counts,
}: {
  active: Category | null;
  counts: { all: number; pressemitteilungen: number; news: number };
}) {
  const nf = new Intl.NumberFormat("de-CH");
  const options: { value: Category | null; label: string; count: number; href: string }[] = [
    { value: null, label: "Alle", count: counts.all, href: "/gemeinde" },
    {
      value: "pressemitteilungen",
      label: "Pressemitteilungen",
      count: counts.pressemitteilungen,
      href: `/gemeinde?${KATEGORIE_KEY}=pressemitteilungen`,
    },
    { value: "news", label: "News", count: counts.news, href: `/gemeinde?${KATEGORIE_KEY}=news` },
  ];

  return (
    <nav className="catfilter" aria-label="Mitteilungen nach Kategorie filtern">
      <ul className="catfilter__list">
        {options.map((o) => {
          const isActive = active === o.value;
          return (
            <li key={o.value ?? "all"} className="catfilter__item">
              <Link
                href={o.href}
                className="catfilter__opt"
                aria-current={isActive ? "page" : undefined}
                scroll={false}
              >
                {o.label}
                <span className="catfilter__count" aria-hidden="true">
                  {nf.format(o.count)}
                </span>
                <span className="sr-only">{`, ${nf.format(o.count)} Einträge`}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
