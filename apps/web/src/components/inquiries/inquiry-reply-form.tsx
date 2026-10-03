"use client";

import { INQUIRY_MESSAGE_MAX_LENGTH, inquiryReplySchema } from "@portal/shared/inquiry";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiClientError, sendJson } from "@/lib/api-client";

type InquiryReplyFormProps = {
  /** REST endpoint that receives `{ body }`, e.g. `/api/admin/inquiries/{id}/messages`. */
  endpoint: string;
  label: string;
};

/** Writes a reply in a conversation; the server-rendered thread is reloaded after sending. */
export function InquiryReplyForm({ endpoint, label }: InquiryReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;

    const parsed = inquiryReplySchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Escribe tu respuesta");
      document.getElementById("inquiry-reply")?.focus();
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      await sendJson("POST", endpoint, parsed.data);
      setBody("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No pudimos enviar la respuesta. Inténtalo de nuevo.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="inquiry-reply" className="block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id="inquiry-reply"
        name="body"
        rows={4}
        maxLength={INQUIRY_MESSAGE_MAX_LENGTH}
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          setError(null);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "inquiry-reply-error" : undefined}
        className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 aria-invalid:border-red-600"
      />
      {error && (
        <p id="inquiry-reply-error" role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isSending}
        className="h-11 rounded-full bg-accent px-6 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover disabled:opacity-70"
      >
        {isSending ? "Enviando…" : "Enviar respuesta"}
      </button>
    </form>
  );
}
