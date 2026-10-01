import Link from "next/link";
import { navigationItems } from "./navigation-items";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p className="text-lg font-semibold tracking-tight">
            Portal <span className="text-sky-700 dark:text-sky-400">Inmobiliario</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            Propiedades en venta y arriendo en Chile.
          </p>
        </div>
        <nav aria-label="Pie de página" className="md:justify-self-end">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-sm text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:text-zinc-400 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-zinc-500 sm:px-6 lg:px-8">
          © {currentYear} Portal Inmobiliario. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
