"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

/**
 * The masthead nav. Client island by necessity: Next 16 intentionally has no
 * server-side pathname (verified against the official usePathname docs —
 * "Reading the current URL from a Server Component is not supported"), so the
 * active rubric must be resolved client-side. This is the intended Next API,
 * not a workaround (CLAUDE.md §9). Header shell + wordmark + footer stay RSC;
 * only this list ships JS. No rewrites in next.config, so usePathname is
 * stable on the SSR pass too — the active state is in the initial HTML, no
 * flash, and the nav still works without JS (plain <Link>s).
 *
 * Active state is INK WEIGHT, never accent (§14 / §11 precedent): the masthead
 * is persistent global chrome; accent there would be a flood (§2). The chosen
 * rubric is weight 600 + full --ink + aria-current="page" (the non-visual
 * encoding). Routes are flat with no nesting, so exact-match is correct — and
 * keeps "/" (Heute) from matching every path.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav" aria-label="Hauptnavigation">
      <ul className="site-nav__list">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="site-nav__item">
              <Link
                href={item.href}
                className="site-nav__link"
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
