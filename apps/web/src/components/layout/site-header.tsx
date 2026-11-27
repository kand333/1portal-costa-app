import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { NavigationLinks } from "./navigation-links";
import { SiteNavigation } from "./site-navigation";

// Rendered in the prerendered HTML until the client knows the current URL.
function SiteNavigationFallback() {
  return (
    <nav aria-label="Principal" className="hidden lg:order-2 lg:block">
      <NavigationLinks activeHref={null} orientation="horizontal" />
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="pointer-events-none sticky top-0 z-40 h-[5.5rem] px-3 pt-3 sm:px-6">
      <div className="pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-full border border-line/70 bg-surface/90 pl-3 pr-2 shadow-lift backdrop-blur-xl lg:justify-between lg:gap-4">
        <Link
          href="/"
          translate="no"
          className="flex min-h-11 items-center gap-2 text-xl font-bold tracking-tight text-ink"
        >
          <Image src="/logo-mark.png" alt="" width={40} height={38} className="h-10 w-auto rounded-full bg-white p-1" />
          <span>
            Propi<span className="text-brass">Zoom</span>
          </span>
        </Link>
        {/* Always visible: next to the menu button on phones, at the right end from `md` up. */}
        <div className="order-2 ml-auto flex items-center gap-2 lg:order-3 lg:ml-0">
          <Link
            href="/properties"
            className="hidden h-10 items-center rounded-full border border-ink/25 px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink hover:bg-paper xl:inline-flex"
          >
            Ver propiedades
          </Link>
          <Link
            href="/tasador-propiedades"
            className="inline-flex h-11 items-center rounded-full bg-[image:var(--ember)] px-4 text-sm font-semibold text-white shadow-soft transition-transform duration-200 hover:-translate-y-0.5 lg:h-10 lg:px-5"
          >
            Tasar gratis
          </Link>
        </div>
        <Suspense fallback={<SiteNavigationFallback />}>
          <SiteNavigation />
        </Suspense>
      </div>
    </header>
  );
}
