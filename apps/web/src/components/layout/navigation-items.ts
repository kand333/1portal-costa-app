export type NavigationItem = {
  label: string;
  href: string;
};

export const navigationItems: readonly NavigationItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Propiedades", href: "/properties" },
  { label: "Vender", href: "/vender" },
  { label: "Tasar", href: "/tasador-propiedades" },
  { label: "Regularizar", href: "/regularizacion" },
  { label: "Entrar a mi cuenta", href: "/login" },
];

/**
 * Returns the href of the navigation item that matches the current URL,
 * or null when no item matches.
 */
export function getActiveNavigationHref(pathname: string): string | null {
  if (pathname === "/") return "/";
  if (pathname === "/login") return "/login";
  if (pathname === "/vender") return "/vender";
  if (pathname === "/regularizacion") return "/regularizacion";
  if (pathname === "/tasador-propiedades" || pathname.startsWith("/tasador-propiedades/")) return "/tasador-propiedades";
  // Reached from the user name shown in place of «Ingresar».
  if (pathname === "/account" || pathname.startsWith("/account/")) return "/account";

  // The catalog (sale and rent) and the property pages belong to «Propiedades».
  if (pathname === "/properties" || pathname.startsWith("/properties/")) return "/properties";

  return null;
}
