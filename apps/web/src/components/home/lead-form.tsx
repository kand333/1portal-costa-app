"use client";

import {
  INQUIRY_EMAIL_MAX_LENGTH,
  INQUIRY_NAME_MAX_LENGTH,
  INQUIRY_PHONE_MAX_LENGTH,
} from "@portal/shared/inquiry";
import { LEAD_ADDRESS_MAX_LENGTH, leadCreateSchema, type LeadSource } from "@portal/shared/lead";
import type { LeadKind } from "@portal/shared/enums";
import { useState, type FormEvent } from "react";
import { useCommune } from "@/components/home/commune-context";
import { useCurrentUser } from "@/hooks/use-current-user";
import { flash } from "@/lib/flash";
import { COMMUNE_NAMES } from "@/lib/communes";
import { submitLead } from "@/lib/lead-submission";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";

type FieldName = "address" | "name" | "email" | "phone";
type Step = "place" | "contact" | "sent";

// Public by design (see .env.example); inlined at build time.
const web3FormsAccessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

const fieldClassName =
  "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 aria-invalid:border-red-600";
const labelClassName = "mb-1.5 block text-sm font-medium text-ink";
const errorClassName = "mt-1 text-sm text-red-700 dark:text-red-400";

const kindOptions: { kind: LeadKind; label: string }[] = [
  { kind: "VALUATION", label: "Quiero vender o arrendar" },
  { kind: "SEARCH", label: "Busco una propiedad" },
];

type LeadFormProps = {
  /** Which form of the page this is; stored with the lead. */
  source: LeadSource;
  /** Prefix of the field ids, so two forms on one page do not clash. */
  idPrefix: string;
  /** Locks the form to one kind and hides the «vender o buscar» switch. */
  fixedKind?: LeadKind;
  /** Opens the form already filled with the property: it starts at the contact step. */
  initialAddress?: string;
  /** Stored with the lead, e.g. the summary of a price estimate. */
  message?: string;
  /** Called once the lead was stored (the page may close a dialog or show its own confirmation). */
  onSent?: () => void;
};

/** Two-step lead form: what and where first (low friction), contact data second. */
export function LeadForm({ source, idPrefix, fixedKind, initialAddress, message, onSent }: LeadFormProps) {
  const { data: currentUser } = useCurrentUser();
  const { commune, setCommune } = useCommune();
  const [kind, setKind] = useState<LeadKind>(fixedKind ?? "VALUATION");
  const [step, setStep] = useState<Step>(initialAddress ? "contact" : "place");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [operation, setOperation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const id = (name: string) => `${idPrefix}-${name}`;
  const nameValue = contact.name || currentUser?.name || "";
  const emailValue = contact.email || currentUser?.email || "";

  function handlePlaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kind === "VALUATION" && address.trim().length < 3) {
      setErrors({ address: "Ingresa la dirección o el sector de la propiedad" });
      document.getElementById(id("address"))?.focus();
      return;
    }
    setErrors({});
    setStep("contact");
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    const form = new FormData(event.currentTarget);
    const parsed = leadCreateSchema.safeParse({
      kind,
      source,
      name: nameValue,
      email: emailValue,
      phone: contact.phone,
      address: kind === "VALUATION" ? address : undefined,
      commune,
      operation: kind === "SEARCH" ? operation : undefined,
      propertyType: kind === "SEARCH" ? propertyType : undefined,
      message,
      website: String(form.get("website") ?? ""),
    });
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as FieldName] ??= issue.message;
      setErrors(next);
      const first = (["name", "email", "phone"] as const).find((field) => next[field]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }

    setErrors({});
    setIsSending(true);
    const result = await submitLead(parsed.data, web3FormsAccessKey);
    setIsSending(false);
    if (result.status === "sent") {
      flash("Recibimos tu solicitud. Te contactaremos pronto.");
      setStep("sent");
      onSent?.();
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

  if (step === "sent") {
    return (
      <div role="status" className="py-2">
        <p className="font-display text-2xl font-semibold text-ink">Solicitud recibida</p>
        <p className="mt-1 text-sm text-muted">Te contactaremos al email que ingresaste lo antes posible.</p>
        <button
          type="button"
          onClick={() => {
            setStep("place");
            setAddress("");
          }}
          className="mt-4 border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <div>
      {!fixedKind && (
        <div role="group" aria-label="Qué necesitas" className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-paper p-1">
          {kindOptions.map((option) => (
            <button
              key={option.kind}
              type="button"
              aria-pressed={kind === option.kind}
              onClick={() => {
                setKind(option.kind);
                setStep("place");
                setErrors({});
              }}
              className="rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors duration-200 aria-pressed:bg-accent aria-pressed:text-on-accent"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {step === "place" ? (
        <form noValidate onSubmit={handlePlaceSubmit} className="space-y-4">
          {kind === "VALUATION" ? (
            <div>
              <label htmlFor={id("address")} className={labelClassName}>
                Dirección o sector de la propiedad
              </label>
              <input
                id={id("address")}
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setErrors({});
                }}
                type="text"
                autoComplete="street-address"
                maxLength={LEAD_ADDRESS_MAX_LENGTH}
                placeholder="Ej. Barros Arana 1000"
                aria-invalid={errors.address ? true : undefined}
                aria-describedby={describedBy("address")}
                className={fieldClassName}
              />
              {fieldError("address")}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={id("operation")} className={labelClassName}>
                  Operación
                </label>
                <select
                  id={id("operation")}
                  value={operation}
                  onChange={(event) => setOperation(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="">Comprar o arrendar</option>
                  <option value="SALE">{operationLabels.SALE}</option>
                  <option value="RENT">{operationLabels.RENT}</option>
                </select>
              </div>
              <div>
                <label htmlFor={id("type")} className={labelClassName}>
                  Tipo de propiedad
                </label>
                <select
                  id={id("type")}
                  value={propertyType}
                  onChange={(event) => setPropertyType(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="">Todos los tipos</option>
                  {Object.entries(propertyTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div>
            <label htmlFor={id("commune")} className={labelClassName}>
              Comuna
            </label>
            <select
              id={id("commune")}
              value={commune}
              onChange={(event) => setCommune(event.target.value)}
              className={fieldClassName}
            >
              <option value="">Selecciona una comuna</option>
              {COMMUNE_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-12 w-full rounded-full bg-accent px-6 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0"
          >
            {kind === "VALUATION" ? "Tasar gratis" : "Continuar"}
          </button>
        </form>
      ) : (
        <form noValidate onSubmit={handleContactSubmit} className="space-y-4">
          <p className="text-sm text-muted">
            {kind === "VALUATION" ? address : "Tu búsqueda"}
            {commune ? ` · ${commune}` : ""}{" "}
            <button
              type="button"
              onClick={() => setStep("place")}
              className="border-b border-brass font-semibold text-ink"
            >
              Cambiar
            </button>
          </p>
          <div>
            <label htmlFor={id("name")} className={labelClassName}>
              Nombre
            </label>
            <input
              id={id("name")}
              value={nameValue}
              onChange={(event) => setContact({ ...contact, name: event.target.value })}
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
            <label htmlFor={id("email")} className={labelClassName}>
              Email
            </label>
            <input
              id={id("email")}
              value={emailValue}
              onChange={(event) => setContact({ ...contact, email: event.target.value })}
              type="email"
              autoComplete="email"
              spellCheck={false}
              maxLength={INQUIRY_EMAIL_MAX_LENGTH}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy("email")}
              className={fieldClassName}
            />
            {fieldError("email")}
          </div>
          <div>
            <label htmlFor={id("phone")} className={labelClassName}>
              Teléfono <span className="font-normal text-muted">(opcional)</span>
            </label>
            <input
              id={id("phone")}
              value={contact.phone}
              onChange={(event) => setContact({ ...contact, phone: event.target.value })}
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
            {isSending ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      )}
    </div>
  );
}
