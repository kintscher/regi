"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { NAV_ITEMS } from "./nav-items";

/**
 * Mobile burger + off-canvas drawer (§14 mobile, Phase 5). Atomic
 * replacement for the wordmark-only mobile placeholder the §14 doc reserved
 * for this phase. The burger is the trigger; the drawer slides in from the
 * right, full-height, capped at min(22rem, 80vw). NAV_ITEMS is the single
 * source of truth — desktop nav and mobile drawer render from the same list
 * so the two cannot drift (§14 contract).
 *
 * A11y discipline (the ULTRATHINK list from the orchestrator brief):
 *  - `role="dialog"` + `aria-modal="true"` + `aria-label` on the drawer
 *  - `aria-expanded` + `aria-controls` on the burger, label flips
 *    «Navigation öffnen» / «Navigation schliessen»
 *  - DIY focus-trap (Tab/Shift+Tab wraps inside the drawer) — no npm
 *    library for a single component (orchestrator pre-decision)
 *  - Escape closes; outside-click on the backdrop closes; route-change
 *    closes; close returns focus to the burger
 *  - First link focused on open
 *  - Body scroll-lock while open (`overflow: hidden` on the body)
 *  - `aria-hidden` on the drawer when closed + `tabIndex=-1` on its links
 *    (belt-and-suspenders with `visibility: hidden` in CSS)
 *  - Active rubric uses the §14 ink-weight grammar (weight 600 + --ink +
 *    `aria-current="page"`); never accent
 */
const LEGAL_ITEMS = [
  { href: "/quellen", label: "Quellen" },
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/kolophon", label: "Kolophon" },
] as const;

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // Body scroll-lock + focus the first link on open.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Defer to next frame so the visibility transition has applied.
    const handle = requestAnimationFrame(() => {
      firstLinkRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(handle);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Escape close + DIY focus-trap.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Route change closes the drawer (Link click fires before navigation, but
  // browser back/forward also navigates without an onClick — this catches it).
  // pathname is read in the body so the lint sees it as a real dependency,
  // not just a trigger; the void keeps the read side-effect-free.
  useEffect(() => {
    void pathname;
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="site-burger"
        aria-expanded={isOpen}
        aria-controls={drawerId}
        aria-label={isOpen ? "Navigation schliessen" : "Navigation öffnen"}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="site-burger__bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Backdrop: visual click-to-close only. role="presentation" + aria-hidden
          per the WAI-ARIA modal pattern — SR users don't see it (keyboard
          close is Escape, already wired). Lives outside the dialog so the
          dialog's content area is the focused region. */}
      <button
        type="button"
        className="site-drawer-backdrop"
        data-open={isOpen}
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
      />

      <div
        ref={drawerRef}
        id={drawerId}
        className="site-drawer"
        data-open={isOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Hauptnavigation"
        aria-hidden={!isOpen}
      >
        <nav className="site-drawer__nav">
          <ul className="site-drawer__list">
            {NAV_ITEMS.map((item, i) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    className="site-drawer__link"
                    aria-current={isActive ? "page" : undefined}
                    onClick={close}
                    tabIndex={isOpen ? 0 : -1}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="site-drawer__legal">
          <ul className="site-drawer__legal-list">
            {LEGAL_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="site-drawer__legal-link"
                  onClick={close}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
