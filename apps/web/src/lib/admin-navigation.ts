export type AdminSection = "dashboard" | "properties" | "inquiries" | "account";

export type AdminNavigationItem = { section: AdminSection; label: string; href: string };

/** Sidebar of /admin, in this order. */
export const adminNavigationItems: readonly AdminNavigationItem[] = [
  { section: "dashboard", label: "Panel administración", href: "/admin" },
  { section: "properties", label: "Administrar propiedades", href: "/admin/properties" },
  { section: "inquiries", label: "Consultas", href: "/admin/inquiries" },
  { section: "account", label: "Mi cuenta", href: "/admin/account" },
];

/** Section of the current admin URL: a section also covers its sub-pages (e.g. a property's edit page). */
export function getActiveAdminSection(pathname: string): AdminSection | null {
  if (pathname === "/admin") return "dashboard";
  const item = adminNavigationItems.find(
    ({ section, href }) => section !== "dashboard" && (pathname === href || pathname.startsWith(`${href}/`)),
  );
  return item?.section ?? null;
}
