"use client";

import {
  INQUIRY_EMAIL_MAX_LENGTH,
  INQUIRY_MESSAGE_MAX_LENGTH,
  INQUIRY_NAME_MAX_LENGTH,
  INQUIRY_PHONE_MAX_LENGTH,
  inquiryCreateSchema,
} from "@portal/shared/inquiry";
import type { AuthUser } from "@portal/shared/auth";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { submitInquiry } from "@/lib/inquiry-submission";

type FieldName = "name" | "email" | "phone" | "message";
type FormValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;
type Status = "idle" | "sending" | "sent" | "error";

const FIELD_ORDER: FieldName[] = ["name", "email", "phone", "message"];
const emptyValues: FormValues = { name: "", email: "", phone: "", message: "" };

/**
 * Fills name and email with the logged-in user's data, without overwriting what was already typed.
 * The phone stays as is: accounts do not store one. The message is never prefilled.
 */
export function withUserContact(values: FormValues, user: Pick<AuthUser, "name" | "email"> | null | undefined): FormValues {
  if (!user) return values;
  return { ...values, name: values.name || user.name, email: values.email || user.email };
}

// Public by design (see .env.example); inlined at build time.
const web3FormsAccessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

const fieldClassName =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 aria-invalid:border-red-600";
const labelClassName = "mb-1.5 block text-sm font-medium text-ink";
const errorClassName = "mt-1 text-sm text-red-700 dark:text-red-400";

type PropertyContactFormProps = {
  propertyId: string;
  propertyTitle: string;
};

/** Contact form of a property: the inquiry is stored by the API and emailed through Web3Forms. */
export function PropertyContactForm({ propertyId, propertyTitle }: PropertyContactFormProps) {
  const { data: currentUser } = useCurrentUser();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [prefilledUserId, setPrefilledUserId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // The session arrives after the first render: prefill once per user, adjusting state while
  // rendering (the pattern React recommends instead of an effect). Fields stay editable.
  if (currentUser && currentUser.id !== prefilledUserId) {
    setPrefilledUserId(currentUser.id);
    setValues((previous) => withUserContact(previous, currentUser));
  }

  const fieldId = (name: FieldName) => `contact-${name}`;
  const errorId = (name: FieldName) => `contact-${name}-error`;

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const name = event.target.name as FieldName;
    setValues((previous) => ({ ...previous, [name]: event.target.value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    // Honeypot: only bots fill the hidden field. They get a success screen and nothing is sent.
    if (new FormData(event.currentTarget).get("botcheck")) {
      setStatus("sent");
      return;
    }

    const parsed = inquiryCreateSchema.safeParse({ propertyId, ...values });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const name = issue.path[0] as FieldName;
        errors[name] ??= issue.message;
      }
      setFieldErrors(errors);
      const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }

    setStatus("sending");
    const result = await submitInquiry(parsed.data, web3FormsAccessKey);
    if (result.status === "sent") {
      // Ready for another inquiry: the user's contact data again, empty phone and message.
      setValues(withUserContact(emptyValues, currentUser));
      setStatus("sent");
    } else {
      setErrorMessage(result.message);
      setStatus("error");
    }
  }

  const fieldProps = (name: FieldName) => ({
    id: fieldId(name),
    name,
    value: values[name],
    onChange: handleChange,
    "aria-invalid": fieldErrors[name] ? true : undefined,
    "aria-describedby": fieldErrors[name] ? errorId(name) : undefined,
  });

  const fieldError = (name: FieldName) =>
    fieldErrors[name] && (
      <p id={errorId(name)} className={errorClassName}>
        {fieldErrors[name]}
      </p>
    );

  return (
    <section
      aria-labelledby="contact-title"
      className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft"
    >
      <h2 id="contact-title" className="font-display text-2xl font-semibold tracking-tight text-ink">
        Solicitar información
      </h2>
      <p className="mt-1 text-sm text-muted">Sobre «{propertyTitle}»</p>

      {status === "sent" ? (
        <div role="status" className="mt-5">
          <p className="font-medium text-ink">Consulta enviada.</p>
          <p className="mt-1 text-sm text-muted">Te responderemos a tu email lo antes posible.</p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-4 border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
          >
            Enviar otra consulta
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor={fieldId("name")} className={labelClassName}>
              Nombre
            </label>
            <input
              {...fieldProps("name")}
              type="text"
              autoComplete="name"
              maxLength={INQUIRY_NAME_MAX_LENGTH}
              className={`${fieldClassName} h-11`}
            />
            {fieldError("name")}
          </div>
          <div>
            <label htmlFor={fieldId("email")} className={labelClassName}>
              Email
            </label>
            <input
              {...fieldProps("email")}
              type="email"
              autoComplete="email"
              spellCheck={false}
              maxLength={INQUIRY_EMAIL_MAX_LENGTH}
              className={`${fieldClassName} h-11`}
            />
            {fieldError("email")}
          </div>
          <div>
            <label htmlFor={fieldId("phone")} className={labelClassName}>
              Teléfono <span className="font-normal text-muted">(opcional)</span>
            </label>
            <input
              {...fieldProps("phone")}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={INQUIRY_PHONE_MAX_LENGTH}
              placeholder="+56 9 1234 5678"
              className={`${fieldClassName} h-11`}
            />
            {fieldError("phone")}
          </div>
          <div>
            <label htmlFor={fieldId("message")} className={labelClassName}>
              Mensaje
            </label>
            <textarea
              {...fieldProps("message")}
              rows={5}
              maxLength={INQUIRY_MESSAGE_MAX_LENGTH}
              className={`${fieldClassName} resize-y py-2.5`}
            />
            {fieldError("message")}
          </div>

          {/* Honeypot for bots: hidden from people and assistive technology. */}
          <div aria-hidden="true" className="hidden">
            <label>
              No completar
              <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {status === "error" && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="h-11 w-full rounded-full bg-accent px-6 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
          >
            {status === "sending" ? "Enviando…" : "Enviar consulta"}
          </button>
        </form>
      )}
    </section>
  );
}
