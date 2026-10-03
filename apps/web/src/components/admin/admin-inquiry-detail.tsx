import type { AdminInquiryDetail as AdminInquiryDetailData } from "@portal/shared/inquiry";
import Link from "next/link";
import type { ReactNode } from "react";
import { InquiryReplyForm } from "@/components/inquiries/inquiry-reply-form";
import { InquiryThread } from "@/components/inquiries/inquiry-thread";
import { ADMIN_INQUIRIES_PATH, buildReplyMailto } from "@/lib/admin-inquiries";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeStyle: "short" });
const linkClassName =
  "font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink";

/** One inquiry for ADMIN: who sent it, about which property, and the conversation with the reply box. */
export function AdminInquiryDetail({ inquiry }: { inquiry: AdminInquiryDetailData }) {
  const contact: [string, ReactNode][] = [
    ["Nombre", inquiry.name],
    ["Email", <a key="email" href={`mailto:${inquiry.email}`} className={linkClassName}>{inquiry.email}</a>],
    ["Teléfono", inquiry.phone ?? "No indicado"],
    ["Usuario", inquiry.user ? `${inquiry.user.name} (${inquiry.user.email})` : "Visitante sin cuenta"],
    ["Fecha", <time key="date" dateTime={inquiry.createdAt}>{dateFormatter.format(new Date(inquiry.createdAt))}</time>],
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <Link
        href={ADMIN_INQUIRIES_PATH}
        className="inline-flex text-sm font-semibold text-muted underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        Volver a consultas
      </Link>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Consulta de {inquiry.name}</h1>
      <p className="mt-2 text-lg text-muted">
        Sobre{" "}
        {inquiry.isPropertyPublic && inquiry.propertyId ? (
          <Link href={`/properties/${inquiry.propertyId}`} className={linkClassName}>
            «{inquiry.propertyTitle}»
          </Link>
        ) : (
          <>«{inquiry.propertyTitle}» (ya no está publicada)</>
        )}
      </p>

      <section aria-labelledby="inquiry-contact-title" className="mt-8 rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
        <h2 id="inquiry-contact-title" className="text-sm font-semibold uppercase tracking-wider text-muted">
          Contacto
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[8rem_1fr]">
          {contact.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="break-words text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {inquiry.hiddenByUser && (
          <p className="mt-4 text-sm text-muted">El usuario quitó esta consulta de su cuenta: ya no ve las respuestas.</p>
        )}
      </section>

      <section aria-labelledby="inquiry-conversation-title" className="mt-10">
        <h2 id="inquiry-conversation-title" className="font-display text-3xl font-semibold tracking-tight text-ink">
          Conversación
        </h2>
        <div className="mt-5">
          <InquiryThread viewer="admin" inquiry={inquiry} messages={inquiry.messages} />
        </div>

        <div className="mt-8 rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
          {!inquiry.user && (
            <p className="mb-4 text-sm text-muted">
              Es un visitante sin cuenta: no verá la respuesta en el portal. Escríbele también{" "}
              <a href={buildReplyMailto(inquiry)} className={linkClassName}>
                por email
              </a>
              ; la respuesta queda registrada aquí.
            </p>
          )}
          <InquiryReplyForm endpoint={`/api/admin/inquiries/${inquiry.id}/messages`} label="Tu respuesta" />
        </div>
      </section>
    </div>
  );
}
