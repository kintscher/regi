import Link from "next/link";
import { TOUR_KEY, type Tour } from "./parser";

/**
 * Tour (Abfuhrkreis) facette for /abfall. Reuses the §12 `.catfilter` gazette
 * index-rail primitive (design-system.md §12 names it the template for any
 * facetted single-source list). Server Component / real <Link>s — zero client
 * JS, shareable, Cmd/middle-click; identical mechanics to the category
 * filter. No counts: the tour split is structural, not a tally.
 */
export function TourFilter({ active }: { active: Tour | null }) {
  const options: { value: Tour | null; label: string; href: string }[] = [
    { value: null, label: "Alle", href: "/abfall" },
    { value: "nord", label: "Tour Nord", href: `/abfall?${TOUR_KEY}=nord` },
    { value: "sued", label: "Tour Süd", href: `/abfall?${TOUR_KEY}=sued` },
  ];

  return (
    <nav className="catfilter" aria-label="Abfuhren nach Tour filtern">
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
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
