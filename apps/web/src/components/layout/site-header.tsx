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
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-background/95 backdrop-blur dark:border-zinc-800">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-md text-lg font-semibold tracking-tight text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:text-white"
        >
          Portal <span className="text-sky-700 dark:text-sky-400">Inmobiliario</span>
        </Link>
        <Suspense fallback={<SiteNavigationFallback />}>
          <SiteNavigation />
        </Suspense>
      </div>
    </header>
  );
}
