import { AccessDenied } from "@/components/auth/access-denied";
import { getAdminUser } from "@/lib/session";

/** Every page under /admin is for ADMIN only: visitors go to the login, a USER sees a 403 message. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await getAdminUser("/admin"))) return <AccessDenied />;
  return children;
}
