import Link from "next/link";
import { MobileNav } from "./mobile-nav";
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
 * content scrolling beneath — the gazette grammar's own device, zero JS in
 * the shell. SiteNav and MobileNav are the client islands (Next 16 has no
 * server pathname, by design).
 *
 * Mobile (< 40rem): SiteNav is hidden and the burger + drawer ship (Phase 5)
 * — both render from NAV_ITEMS so desktop and mobile never drift (§14).
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__mark" aria-label="regi – Startseite">
          regi
        </Link>
        <SiteNav />
        <MobileNav />
      </div>
    </header>
  );
}
