export type NavigationItem = {
  label: string;
  href: string;
};

export const navigationItems: readonly NavigationItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Proyectos nuevos", href: "/properties?operation=SALE" },
  { label: "Tasación", href: "/tasador-propiedades" },
  { label: "Corretaje", href: "/#cierre" },
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
  if (pathname === "/tasador-propiedades" || pathname.startsWith("/tasador-propiedades/")) return "/tasador-propiedades";
  // Reached from the user name shown in place of «Ingresar».
  if (pathname === "/account" || pathname.startsWith("/account/")) return "/account";

  if (pathname === "/properties" || pathname.startsWith("/properties/")) {
    if (pathname === "/properties" && (operation === "SALE" || operation === "RENT")) {
      return `/properties?operation=${operation}`;
    }
    return "/properties";
  }

  return null;
}
