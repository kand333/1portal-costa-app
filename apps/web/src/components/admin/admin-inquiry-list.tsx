import type { AdminInquirySummary } from "@portal/shared/inquiry";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import type { PaginatedResponse } from "@portal/shared/property";
import Link from "next/link";
import { Pagination } from "@/components/properties/pagination";
import { ADMIN_INQUIRIES_PATH, toAdminInquiryListQuery, type AdminInquiryListParams } from "@/lib/admin-inquiries";
import { cn } from "@/lib/cn";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });
const numberFormatter = new Intl.NumberFormat("es-CL");

/** Cells stack in a grid on phones and become a table from `xl` up (room for the sidebar). */
const rowClassName = "grid gap-1 border-b border-line py-4 last:border-b-0 xl:table-row";
const cellClassName = "xl:table-cell xl:py-4 xl:pr-4 xl:align-top";
const badgeClassName = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";

function StatusBadge({ inquiry }: { inquiry: AdminInquirySummary }) {
  return inquiry.awaitingReply ? (
    <span className={cn(badgeClassName, "border-brass/50 text-brass-text")}>Sin responder</span>
  ) : (
    <span className={cn(badgeClassName, "border-accent/40 bg-accent/10 text-ink")}>Respondida</span>
  );
}

function InquiryRow({ inquiry }: { inquiry: AdminInquirySummary }) {
  return (
    <tr className={rowClassName}>
      <td className={cn(cellClassName, "text-sm text-muted xl:w-36")}>
        <time dateTime={inquiry.createdAt}>{dateFormatter.format(new Date(inquiry.createdAt))}</time>
      </td>
      <td className={cn(cellClassName, "font-medium text-ink")}>
        {inquiry.isPropertyPublic && inquiry.propertyId ? (
          <Link
            href={`/properties/${inquiry.propertyId}`}
            className="underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            {inquiry.propertyTitle}
          </Link>
        ) : (
          <>
            {inquiry.propertyTitle}
            <span className="block text-xs font-normal text-muted">Ya no está publicada</span>
          </>
        )}
      </td>
      <td className={cn(cellClassName, "text-sm")}>
        <span className="block font-medium text-ink">{inquiry.name}</span>
        <span className="block break-all text-muted">{inquiry.email}</span>
        {inquiry.phone && <span className="block text-muted">{inquiry.phone}</span>}
        <span className="block text-xs text-muted">{inquiry.user ? `Usuario: ${inquiry.user.name}` : "Visitante"}</span>
      </td>
      <td className={cn(cellClassName, "text-sm text-ink/85")}>
        <p className="line-clamp-2 break-words">{inquiry.message}</p>
        {inquiry.lastMessage && (
          <div className="mt-2 border-l-2 border-brass/60 pl-3">
            <p className="text-xs text-muted">
              Última entrada · <span className="font-semibold text-ink">{inquiry.lastMessage.fromAdmin ? "Portal" : inquiry.name}</span> ·{" "}
              <time dateTime={inquiry.lastMessage.createdAt}>{dateFormatter.format(new Date(inquiry.lastMessage.createdAt))}</time>
            </p>
            <p className="line-clamp-2 break-words">{inquiry.lastMessage.body}</p>
          </div>
        )}
      </td>
      <td className={cn(cellClassName, "xl:w-32")}>
        <StatusBadge inquiry={inquiry} />
        {inquiry.messageCount > 0 && (
          <span className="mt-1 block text-xs text-muted">
            {inquiry.messageCount === 1 ? "1 respuesta" : `${inquiry.messageCount} respuestas`}
          </span>
        )}
      </td>
      <td className={cn(cellClassName, "xl:pr-0 xl:text-right")}>
        <Link
          href={`${ADMIN_INQUIRIES_PATH}/${inquiry.id}`}
          aria-label={`Ver la conversación con ${inquiry.name} sobre «${inquiry.propertyTitle}»`}
          className="inline-flex h-10 items-center whitespace-nowrap rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-paper"
        >
          Ver conversación
        </Link>
      </td>
    </tr>
  );
}

type AdminInquiryListProps = {
  result: PaginatedResponse<AdminInquirySummary>;
  params: AdminInquiryListParams;
};

/** ADMIN inquiries, newest first: who asked about which property, with the answer status. */
export function AdminInquiryList({ result, params }: AdminInquiryListProps) {
  const { data: inquiries, meta } = result;
  const { search } = params;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Consultas</h1>
      <p className="mt-2 text-lg text-muted">Solicitudes de información, con actividad más reciente primero.</p>

      {/* A plain GET form: the search lives in the URL and works without JavaScript. */}
      <form action={ADMIN_INQUIRIES_PATH} method="get" role="search" aria-label="Buscar consultas" className="mt-8 flex flex-wrap gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="admin-inquiry-search" className="sr-only">
            Buscar por propiedad, nombre, email o mensaje
          </label>
          <input
            id="admin-inquiry-search"
            name="search"
            type="search"
            defaultValue={search}
            maxLength={MAX_SEARCH_LENGTH}
            placeholder="Propiedad, nombre, email o mensaje"
            className="h-12 w-full rounded-full border border-line bg-surface px-5 text-ink shadow-soft transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-full border border-line px-7 font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-surface"
        >
          Buscar
        </button>
        {search && (
          <Link
            href={ADMIN_INQUIRIES_PATH}
            className="inline-flex h-12 items-center px-2 text-sm font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            Limpiar búsqueda
          </Link>
        )}
      </form>

      <p aria-live="polite" className="mt-6 text-sm text-muted">
        {meta.total === 1 ? "1 consulta" : `${numberFormatter.format(meta.total)} consultas`}
        {search && ` para «${search}»`}
      </p>

      {inquiries.length === 0 ? (
        <p className="mt-4 rounded-[1.25rem] border border-dashed border-line p-8 text-center text-muted">
          {meta.total === 0
            ? search
              ? "Ninguna consulta coincide con la búsqueda."
              : "Aún no hay consultas."
            : "No hay consultas en esta página."}
        </p>
      ) : (
        <div className="mt-4 rounded-[1.25rem] border border-line bg-surface px-4 shadow-soft xl:px-6">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Consultas recibidas</caption>
            <thead className="max-xl:sr-only">
              <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Fecha</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Propiedad</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Contacto</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Mensaje</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Estado</th>
                <th scope="col" className="py-3 text-right font-semibold">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <InquiryRow key={inquiry.id} inquiry={inquiry} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        pathname={ADMIN_INQUIRIES_PATH}
        searchParams={toAdminInquiryListQuery(params)}
        currentPage={meta.page}
        totalPages={meta.totalPages}
      />
    </div>
  );
}
