"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { getActiveNavigationHref } from "./navigation-items";
import { NavigationLinks } from "./navigation-links";

const mobileNavigationId = "mobile-navigation";

export function SiteNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const activeHref = getActiveNavigationHref(pathname, searchParams.get("operation"));

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleMobileNavigationKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape") return;
    closeMenu();
    menuButtonRef.current?.focus();
  }

  return (
    <>
      <nav aria-label="Principal" className="hidden md:block">
        <NavigationLinks activeHref={activeHref} orientation="horizontal" />
      </nav>

      <button
        ref={menuButtonRef}
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 md:hidden dark:text-zinc-200 dark:hover:bg-zinc-800"
        aria-expanded={isMenuOpen}
        aria-controls={mobileNavigationId}
        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {isMenuOpen && (
        <nav
          id={mobileNavigationId}
          aria-label="Principal"
          className="absolute inset-x-0 top-full border-b border-zinc-200 bg-background px-4 py-3 shadow-sm md:hidden dark:border-zinc-800"
          onKeyDown={handleMobileNavigationKeyDown}
        >
          <NavigationLinks activeHref={activeHref} orientation="vertical" onNavigate={closeMenu} />
        </nav>
      )}
    </>
  );
}
