import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";

/**
 * Public chrome layout. Wraps every public page (the six source routes, the
 * landing, and the Phase-4 mandatory pages — all live under (public) so they
 * inherit this; the route group does not change the URL). The root layout
 * stays the bare html/font/nuqs shell — this one owns the masthead/footer
 * gazette chrome (docs/design-system.md §14).
 *
 * Skip link first in the DOM (WCAG 2.4.1): it targets the content region, a
 * tabindex=-1 wrapper, NOT a <main> — each page renders its own
 * <main className="page">, so a layout-level <main> would duplicate the
 * landmark. The wrapper also serves as the flex spacer that pushes the footer
 * to the bottom (the root <body> is the flex column).
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#inhalt">
        Zum Inhalt springen
      </a>
      <SiteHeader />
      <div id="inhalt" tabIndex={-1} className="site-main">
        {children}
      </div>
      <SiteFooter />
    </>
  );
}
