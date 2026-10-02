import Link from "next/link";
import { navigationItems } from "./navigation-items";

// The footer is always dark: it closes the page with a quiet, weighty band in both color schemes.
export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0e1213] text-[#ecebe7]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p translate="no" className="font-display text-3xl font-semibold tracking-tight">
            Portal Inmobiliario
          </p>
          <p className="mt-3 max-w-sm text-[#a3a9ab]">Propiedades en venta y arriendo en Chile.</p>
        </div>
        <nav aria-label="Pie de página" className="md:justify-self-end">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-sm text-[#a3a9ab] transition-colors duration-200 hover:text-white focus-visible:outline-[#c2a574]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-[#7d8588] sm:px-6 lg:px-8">
          © {currentYear} Portal Inmobiliario. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
