import type { AuthUser } from "@portal/shared/auth";
import type { UserRole } from "@portal/shared/enums";
import Link from "next/link";
import type { ReactNode } from "react";
import { InquiredProperties } from "./inquired-properties";
import { SavedProperties } from "./saved-properties";

export const userRoleLabels: Record<UserRole, string> = {
  USER: "Usuario",
  ADMIN: "Administrador",
};

type AccountSectionProps = {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
};

/** A section of the account page. */
function AccountSection({ id, title, description, children }: AccountSectionProps) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-1 text-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Private area: basic information, saved properties and properties the user asked about. */
export function AccountOverview({ user }: { user: AuthUser }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">Mi cuenta</h1>
      <p className="mt-3 text-lg text-muted">Hola, {user.name}.</p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section aria-labelledby="account-information-title" className="lg:self-start">
          <div className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
            <h2 id="account-information-title" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Información
            </h2>
            <dl className="mt-4 divide-y divide-line/70">
              <div className="py-3">
                <dt className="text-sm text-muted">Nombre</dt>
                <dd className="mt-0.5 font-medium text-ink break-words">{user.name}</dd>
              </div>
              <div className="py-3">
                <dt className="text-sm text-muted">Email</dt>
                <dd className="mt-0.5 font-medium text-ink break-all">{user.email}</dd>
              </div>
              <div className="py-3">
                <dt className="text-sm text-muted">Tipo de cuenta</dt>
                <dd className="mt-0.5 font-medium text-ink">{userRoleLabels[user.role]}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col items-start gap-3">
              <Link
                href="/account/edit"
                className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
              >
                Editar cuenta
              </Link>
            </div>
          </div>
        </section>

        <div className="space-y-12">
          <AccountSection
            id="saved-properties-title"
            title="Propiedades guardadas"
            description="Las propiedades que marques como favoritas."
          >
            <SavedProperties />
          </AccountSection>

          <AccountSection
            id="inquired-properties-title"
            title="Propiedades consultadas"
            description="Las propiedades por las que enviaste una consulta."
          >
            <InquiredProperties />
          </AccountSection>
        </div>
      </div>
    </div>
  );
}
