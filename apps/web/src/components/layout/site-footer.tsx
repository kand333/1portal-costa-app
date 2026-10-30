import Image from "next/image";
import Link from "next/link";
import { navigationItems } from "./navigation-items";

// An orange band with slow waves closes the page, like the reference. Dark text keeps the small links readable on orange.
export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-[image:var(--ember)] text-ink">
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="footer-waves absolute inset-y-0 -left-[10%] -z-10 h-full w-[120%] opacity-30"
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <path
            key={index}
            d={`M0 ${60 + index * 70} C 240 ${index * 70} 480 ${150 + index * 70} 720 ${70 + index * 70} S 1200 ${index * 70} 1440 ${80 + index * 70}`}
            fill="none"
            stroke="#fff"
            strokeWidth={26}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="mx-auto flex min-h-[28rem] max-w-7xl flex-col justify-between gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <p translate="no" className="flex items-center gap-3 text-4xl font-bold tracking-tight text-white">
            <span className="flex size-14 items-center justify-center rounded-full bg-white">
              <Image src="/logo-mark.png" alt="" width={40} height={38} className="h-10 w-auto" />
            </span>
            PropiZoom
          </p>
          <nav aria-label="Pie de página">
            <ul className="flex flex-col gap-3 lg:items-center">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-sm font-mono text-xs font-medium uppercase tracking-[0.2em] transition-opacity duration-200 hover:opacity-70 focus-visible:outline-white"
                  >
                    [ {item.label} ]
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="font-display text-4xl leading-tight text-white lg:text-right">Tu corredora en el Gran Concepción.</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.18em]">
          © {currentYear} PropiZoom · Corredora de propiedades en el Gran Concepción
        </p>
      </div>
    </footer>
  );
}
