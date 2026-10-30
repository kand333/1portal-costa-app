import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { NavigationLinks } from "./navigation-links";
import { SiteNavigation } from "./site-navigation";

// Rendered in the prerendered HTML until the client knows the current URL.
function SiteNavigationFallback() {
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <NavigationLinks activeHref={null} orientation="horizontal" />
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="pointer-events-none sticky top-0 z-40 h-[5.5rem] px-3 pt-3 sm:px-6">
      <div className="pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full border border-line/70 bg-white/95 pl-3 pr-2 shadow-lift backdrop-blur-xl">
        <Link
          href="/"
          translate="no"
          className="flex min-h-11 items-center gap-2 text-xl font-bold tracking-tight text-ink"
        >
          <Image src="/logo-mark.png" alt="" width={40} height={38} className="h-9 w-auto" />
          <span>
            Propi<span className="text-brass">Zoom</span>
          </span>
        </Link>
        <Suspense fallback={<SiteNavigationFallback />}>
          <SiteNavigation />
        </Suspense>
        <Link
          href="/tasador-propiedades"
          className="hidden h-10 items-center rounded-full bg-[image:var(--ember)] px-5 text-sm font-semibold text-white shadow-soft transition-transform duration-200 hover:-translate-y-0.5 md:inline-flex"
        >
          Tasar gratis
        </Link>
      </div>
    </header>
  );
}
