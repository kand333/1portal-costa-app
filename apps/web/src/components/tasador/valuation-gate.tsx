"use client";

import { INQUIRY_EMAIL_MAX_LENGTH, INQUIRY_NAME_MAX_LENGTH } from "@portal/shared/inquiry";
import { useState, type FormEvent } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";

export type GateContact = { name: string; email: string; website: string };

type ValuationGateProps = {
  /** Called with valid contact data; resolves to an error message, or null when the price may be shown. */
  onSubmit: (contact: GateContact) => Promise<string | null>;
  onBack: () => void;
};

const fieldClassName =
  "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 aria-invalid:border-red-600";
const labelClassName = "mb-1.5 block text-sm font-medium text-ink";
const errorClassName = "mt-1 text-sm text-red-700 dark:text-red-400";

/** Last step before the price: name and email only. Without them the estimate is not shown. */
export function ValuationGate({ onSubmit, onBack }: ValuationGateProps) {
  const { data: currentUser } = useCurrentUser();
  const [typed, setTyped] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const name = typed.name || currentUser?.name || "";
  const email = typed.email || currentUser?.email || "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    const next: { name?: string; email?: string } = {};
    if (name.trim().length < 2) next.name = "Ingresa tu nombre";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Ingresa un email válido, por ejemplo nombre@correo.cl";
    setErrors(next);
    if (next.name || next.email) {
      document.getElementById(next.name ? "valuation-gate-name" : "valuation-gate-email")?.focus();
      return;
    }
    setIsSending(true);
    setErrorMessage("");
    const website = String(new FormData(event.currentTarget).get("website") ?? "");
    const failure = await onSubmit({ name: name.trim(), email: email.trim(), website });
    setIsSending(false);
    if (failure) setErrorMessage(failure);
  }

  return (
    <form noValidate onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">Tu tasación está lista</h2>
        <p className="mt-2 text-muted">Déjanos tu nombre y correo para mostrártela. Un agente podrá afinar el precio, sin costo.</p>
      </div>

      <div>
        <label htmlFor="valuation-gate-name" className={labelClassName}>
          Nombre
        </label>
        <input
          id="valuation-gate-name"
          value={name}
          onChange={(event) => setTyped({ ...typed, name: event.target.value })}
          type="text"
          autoComplete="name"
          maxLength={INQUIRY_NAME_MAX_LENGTH}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "valuation-gate-name-error" : undefined}
          className={fieldClassName}
        />
        {errors.name && (
          <p id="valuation-gate-name-error" className={errorClassName}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="valuation-gate-email" className={labelClassName}>
          Correo
        </label>
        <input
          id="valuation-gate-email"
          value={email}
          onChange={(event) => setTyped({ ...typed, email: event.target.value })}
          type="email"
          autoComplete="email"
          spellCheck={false}
          maxLength={INQUIRY_EMAIL_MAX_LENGTH}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "valuation-gate-email-error" : undefined}
          className={fieldClassName}
        />
        {errors.email && (
          <p id="valuation-gate-email-error" className={errorClassName}>
            {errors.email}
          </p>
        )}
      </div>

      {/* Honeypot for bots: hidden from people and assistive technology. */}
      <div aria-hidden="true" className="hidden">
        <label>
          No completar
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {errorMessage && (
        <p role="alert" className={errorClassName}>
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={isSending}
          className="h-12 rounded-full bg-accent px-8 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
        >
          {isSending ? "Calculando…" : "Ver mi tasación"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isSending}
          className="border-b border-brass pb-0.5 text-sm font-semibold text-brass-text transition-colors duration-200 hover:border-ink"
        >
          Atrás
        </button>
      </div>
    </form>
  );
}
