export type NavigationItem = {
  label: string;
  href: string;
};

export const navigationItems: readonly NavigationItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Propiedades", href: "/properties" },
  { label: "Comprar", href: "/properties?operation=SALE" },
  { label: "Arrendar", href: "/properties?operation=RENT" },
  { label: "Ingresar", href: "/login" },
];

/**
 * Returns the href of the navigation item that matches the current URL,
 * or null when no item matches.
 */
export function getActiveNavigationHref(
  pathname: string,
  operation: string | null,
): string | null {
  if (pathname === "/") return "/";
  if (pathname === "/login") return "/login";

  if (pathname === "/properties" || pathname.startsWith("/properties/")) {
    if (pathname === "/properties" && (operation === "SALE" || operation === "RENT")) {
      return `/properties?operation=${operation}`;
    }
    return "/properties";
  }

  return null;
}
