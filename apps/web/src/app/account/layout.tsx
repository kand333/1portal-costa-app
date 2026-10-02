import { requireSessionUser } from "@/lib/session";

/** Every page under /account needs a session (USER or ADMIN); visitors go to the login. */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  await requireSessionUser("/account");
  return children;
}
