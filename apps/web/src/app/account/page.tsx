import type { Metadata } from "next";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mi cuenta | Portal Inmobiliario",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await requireSessionUser("/account");
  return (
    <section aria-labelledby="account-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 id="account-title" className="font-display text-5xl font-semibold tracking-tight text-ink">
        Mi cuenta
      </h1>
      <p className="mt-3 text-lg text-muted">Hola, {user.name}.</p>
    </section>
  );
}
