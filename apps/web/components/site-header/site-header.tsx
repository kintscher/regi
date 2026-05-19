import Link from "next/link";
import { SiteNav } from "./site-nav";

/**
 * Site masthead (RSC). A gazette nameplate, not an app bar: the wordmark sits
 * in the existing list-title voice (--text-lg / 600), dominant by its fixed
 * position and the strong masthead rule, quiet by size — so the page's own
 * H1 (--text-xl) stays the largest thing on any page (content-first; chrome
 * recedes). docs/design-system.md §14.
 *
 * Sticky with no scroll listener and no shadow: the opaque --paper background
 * plus the permanent --rule-strong masthead rule already separate it from
 * content scrolling beneath — the gazette grammar's own device, zero JS,
 * keeping this component a Server Component.
 *
 * Mobile (< 40rem): the nav is hidden and no burger is shown this phase — a
 * dead placeholder would be a broken affordance. The working burger + drawer
 * arrive together in Phase 5. Routes remain reachable by URL meanwhile (no
 * regression — that was already the only way).
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__mark" aria-label="regi – Startseite">
          regi
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
