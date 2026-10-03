import type { UserInquiryDetail } from "@portal/shared/inquiry";
import Link from "next/link";
import { InquiryReplyForm } from "@/components/inquiries/inquiry-reply-form";
import { InquiryThread } from "@/components/inquiries/inquiry-thread";
import { inquiryTitle } from "@/lib/my-inquiries";

const linkClassName =
  "font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink";

/** One of the user's inquiries: the conversation with the portal and a box to answer. */
export function InquiryConversation({ inquiry, userName }: { inquiry: UserInquiryDetail; userName: string }) {
  const title = inquiryTitle(inquiry);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <Link
        href="/account"
        className="inline-flex text-sm font-semibold text-muted underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        Volver a mi cuenta
      </Link>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Tu consulta</h1>
      <p className="mt-2 text-lg text-muted">
        Sobre{" "}
        {inquiry.property ? (
          <Link href={`/properties/${inquiry.property.id}`} className={linkClassName}>
            «{title}»
          </Link>
        ) : (
          <>«{title}» (ya no está publicada)</>
        )}
      </p>

      <div className="mt-10">
        <InquiryThread viewer="user" inquiry={{ name: userName, message: inquiry.message, createdAt: inquiry.createdAt }} messages={inquiry.messages} />
        {inquiry.messages.length === 0 && (
          <p className="mt-4 text-sm text-muted">Aún no hay respuesta: aparecerá aquí cuando el portal conteste.</p>
        )}
      </div>

      <div className="mt-8 rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
        <InquiryReplyForm endpoint={`/api/account/inquiries/${inquiry.id}/messages`} label="Escribe un mensaje" />
      </div>
    </div>
  );
}
