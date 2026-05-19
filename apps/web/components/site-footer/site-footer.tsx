import Link from "next/link";

/**
 * Site footer (RSC). The imprint line of a printed gazette, not a SaaS
 * megafooter: a quiet, left-aligned, single-column block, identical at every
 * breakpoint (no split bar to reflow). A --rule-strong top rule bookends the
 * masthead's bottom rule. The mandatory links use the same non-accent
 * chrome-link grammar as the nav — accent stays rare, links/selection only
 * (docs/design-system.md §14). The full source list with licences lives on
 * /quellen (Phase 4); here the gazette cross-references it by name in CH
 * guillemets, link-free, to avoid a duplicate Quellen link.
 */
const LEGAL_LINKS = [
  { href: "/quellen", label: "Quellen" },
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/kolophon", label: "Kolophon" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="site-foot__inner">
        <p className="site-foot__tagline">regi — Aggregator für Regensdorf ZH</p>
        <p className="site-foot__attr">
          Daten aus öffentlichen Schweizer Quellen — Details unter «Quellen».
        </p>
        <nav aria-label="Rechtliches">
          <ul className="site-foot__links">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href} className="site-foot__item">
                <Link href={item.href} className="site-foot__link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="site-foot__copy">© 2026 regi</p>
      </div>
    </footer>
  );
}
