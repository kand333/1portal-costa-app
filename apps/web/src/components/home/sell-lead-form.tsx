"use client";

import { INQUIRY_NAME_MAX_LENGTH, INQUIRY_PHONE_MAX_LENGTH } from "@portal/shared/inquiry";
import { leadCreateSchema, type LeadCreateInput } from "@portal/shared/lead";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { COMMUNE_NAMES } from "@/lib/communes";
import { trackEvent } from "@/lib/analytics";
import { flash } from "@/lib/flash";
import { submitLead } from "@/lib/lead-submission";
import { propertyTypeLabels } from "@/lib/property-format";

// Public by design (see .env.example); inlined at build time.
const web3FormsAccessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

/** The API requires an email; this form does not ask for one, so a technical value is stored when it is left empty. */
export const SELL_LEAD_FALLBACK_EMAIL = "propizoom@gmail.com";

export const SELL_TIMING_OPTIONS = ["Lo antes posible", "En 1 a 3 meses", "En 3 a 6 meses", "Solo estoy mirando"] as const;

type FieldName = "commune" | "propertyType" | "phone" | "name" | "email";

const fieldClassName =
  "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 aria-invalid:border-red-600";
const labelClassName = "mb-1.5 block text-sm font-medium text-ink";
const errorClassName = "mt-1 text-sm text-red-700 dark:text-red-400";

/** What the person said they want to sell, as the single `message` the API stores. */
export function buildSellMessage(estimatedValue: string, timing: string): string | undefined {
  const parts = [
    estimatedValue.trim() ? `Valor estimado: $${Number(estimatedValue).toLocaleString("es-CL")}` : "",
    timing ? `Plazo: ${timing}` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Builds the lead from the form values (pure, so it can be tested without the DOM). */
export function buildSellLead(values: {
  commune: string;
  propertyType: string;
  estimatedValue: string;
  timing: string;
  name: string;
  phone: string;
  email: string;
  website?: string;
}): LeadCreateInput {
  return {
    kind: "VALUATION",
    source: "vender",
    name: values.name,
    email: values.email.trim() || SELL_LEAD_FALLBACK_EMAIL,
    phone: values.phone,
    // The contract requires an address for a valuation: the commune is what this form asks for.
    address: values.commune,
    commune: values.commune,
    propertyType: values.propertyType,
    message: buildSellMessage(values.estimatedValue, values.timing),
    website: values.website ?? "",
  };
}

/** One-step «Quiero vender» form: place, value and timing, then contact. */
export function SellLeadForm({ idPrefix = "sell" }: { idPrefix?: string }) {
  const [values, setValues] = useState({ commune: "", propertyType: "", estimatedValue: "", timing: "", name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const id = (name: string) => `${idPrefix}-${name}`;
  const update = (name: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [name]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    const form = new FormData(event.currentTarget);
    const next: Partial<Record<FieldName, string>> = {};
    if (!values.commune) next.commune = "Elige la comuna de la propiedad";
    if (!values.propertyType) next.propertyType = "Elige el tipo de propiedad";
    if (!values.phone.trim()) next.phone = "Ingresa tu celular para escribirte por WhatsApp";

    const parsed = leadCreateSchema.safeParse(buildSellLead({ ...values, website: String(form.get("website") ?? "") }));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "name" || field === "phone" || field === "email") next[field] ??= issue.message;
      }
    }
    if (Object.keys(next).length > 0 || !parsed.success) {
      setErrors(next);
      const first = (["commune", "propertyType", "name", "phone", "email"] as const).find((field) => next[field]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }

    setErrors({});
    setErrorMessage("");
    setIsSending(true);
    const result = await submitLead(parsed.data, web3FormsAccessKey);
    setIsSending(false);
    if (result.status === "sent") {
      flash("Recibimos tu solicitud. Te escribiremos por WhatsApp.");
      trackEvent("generate_lead", { lead_source: "vender" });
      setIsSent(true);
    } else {
      setErrorMessage(result.message);
    }
  }

  const fieldError = (name: FieldName) =>
    errors[name] && (
      <p id={id(`${name}-error`)} className={errorClassName}>
        {errors[name]}
      </p>
    );
  const describedBy = (name: FieldName) => (errors[name] ? id(`${name}-error`) : undefined);

  if (isSent) {
    return (
      <div role="status" className="py-2">
        <p className="font-display text-2xl font-semibold text-ink">Solicitud recibida</p>
        <p className="mt-1 text-sm text-muted">Un corredor te escribirá por WhatsApp en menos de 24 horas hábiles.</p>
        <button
          type="button"
          onClick={() => {
            setIsSent(false);
            setValues({ commune: "", propertyType: "", estimatedValue: "", timing: "", name: "", phone: "", email: "" });
          }}
          className="mt-4 border-b border-brass pb-0.5 text-sm font-semibold text-brass-text transition-colors duration-200 hover:border-ink"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id("commune")} className={labelClassName}>
            ¿En qué comuna está?
          </label>
          <select
            id={id("commune")}
            value={values.commune}
            onChange={update("commune")}
            aria-invalid={errors.commune ? true : undefined}
            aria-describedby={describedBy("commune")}
            className={fieldClassName}
          >
            <option value="">Selecciona</option>
            {COMMUNE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {fieldError("commune")}
        </div>
        <div>
          <label htmlFor={id("propertyType")} className={labelClassName}>
            Tipo de propiedad
          </label>
          <select
            id={id("propertyType")}
            value={values.propertyType}
            onChange={update("propertyType")}
            aria-invalid={errors.propertyType ? true : undefined}
            aria-describedby={describedBy("propertyType")}
            className={fieldClassName}
          >
            <option value="">Selecciona</option>
            {Object.entries(propertyTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError("propertyType")}
        </div>
        <div>
          <label htmlFor={id("estimatedValue")} className={labelClassName}>
            Valor estimado <span className="font-normal text-muted">(CLP, opcional)</span>
          </label>
          <input
            id={id("estimatedValue")}
            value={values.estimatedValue}
            onChange={update("estimatedValue")}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Ej. 100000000"
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor={id("timing")} className={labelClassName}>
            ¿Cuándo quieres vender?
          </label>
          <select id={id("timing")} value={values.timing} onChange={update("timing")} className={fieldClassName}>
            <option value="">Selecciona</option>
            {SELL_TIMING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className={labelClassName}>
            Tu nombre
          </label>
          <input
            id={id("name")}
            value={values.name}
            onChange={update("name")}
            type="text"
            autoComplete="name"
            maxLength={INQUIRY_NAME_MAX_LENGTH}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className={fieldClassName}
          />
          {fieldError("name")}
        </div>
        <div>
          <label htmlFor={id("phone")} className={labelClassName}>
            Tu celular (WhatsApp)
          </label>
          <input
            id={id("phone")}
            value={values.phone}
            onChange={update("phone")}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={INQUIRY_PHONE_MAX_LENGTH}
            placeholder="+56 9 1234 5678"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone")}
            className={fieldClassName}
          />
          {fieldError("phone")}
        </div>
      </div>
      <div>
        <label htmlFor={id("email")} className={labelClassName}>
          Email <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id={id("email")}
          value={values.email}
          onChange={update("email")}
          type="email"
          autoComplete="email"
          spellCheck={false}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          className={fieldClassName}
        />
        {fieldError("email")}
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

      <button
        type="submit"
        disabled={isSending}
        className="h-12 w-full rounded-full bg-accent px-6 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
      >
        {isSending ? "Enviando…" : "Quiero vender mi propiedad"}
      </button>
      <p className="text-sm text-muted">Sin costo ni compromiso. Un corredor te escribe por WhatsApp en menos de 24 horas hábiles.</p>
      <p className="text-xs text-muted">
        Usamos tus datos solo para responder tu solicitud.{" "}
        <Link href="/privacidad" className="underline decoration-brass underline-offset-2 hover:text-ink">
          Privacidad
        </Link>
      </p>
    </form>
  );
}
