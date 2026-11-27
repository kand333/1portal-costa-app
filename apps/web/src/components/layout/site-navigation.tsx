"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logOut } from "@/lib/auth-client";
import { flash } from "@/lib/flash";
import { getActiveNavigationHref } from "./navigation-items";
import { NavigationLinks } from "./navigation-links";

const mobileNavigationId = "mobile-navigation";

const subscribeNever = () => () => undefined;
/** False while rendering on the server and hydrating, true afterwards. */
const useIsHydrated = () => useSyncExternalStore(subscribeNever, () => true, () => false);

export function SiteNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Hydration renders no active link (like the Suspense fallback): the server HTML cannot disagree with the URL.
  const isHydrated = useIsHydrated();
  const activeHref = isHydrated ? getActiveNavigationHref(pathname) : null;

  function closeMenu() {
    setIsMenuOpen(false);
  }

  async function handleLogout() {
    closeMenu();
    await logOut().catch(() => flash("No pudimos cerrar la sesión. Inténtalo de nuevo.", "error"));
    router.refresh();
  }

  function handleMobileNavigationKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape") return;
    closeMenu();
    menuButtonRef.current?.focus();
  }

  return (
    <>
      <nav aria-label="Principal" className="hidden lg:order-2 lg:block">
        <NavigationLinks
          activeHref={activeHref}
          orientation="horizontal"
          userName={currentUser?.name}
          isAdmin={currentUser?.role === "ADMIN"}
          onLogout={handleLogout}
        />
      </nav>

      <button
        ref={menuButtonRef}
        type="button"
        className="order-3 inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors duration-200 hover:bg-surface lg:hidden"
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
          className="absolute inset-x-0 top-full mt-2 rounded-3xl border border-line bg-surface px-4 py-3 shadow-lift lg:hidden"
          onKeyDown={handleMobileNavigationKeyDown}
        >
          <NavigationLinks
            activeHref={activeHref}
            orientation="vertical"
            onNavigate={closeMenu}
            userName={currentUser?.name}
          isAdmin={currentUser?.role === "ADMIN"}
            onLogout={handleLogout}
          />
        </nav>
      )}
    </>
  );
}
