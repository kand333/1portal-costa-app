"use client";

import type { UserInquiry } from "@portal/shared/inquiry";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMyInquiries } from "@/hooks/use-my-inquiries";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { filterInquiries, inquiryTitle, paginateInquiries, removeMyInquiry } from "@/lib/my-inquiries";
import { formatLocation, formatPrice } from "@/lib/property-format";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "long" });
const FEEDBACK_DURATION_MS = 4000;

const linkClassName =
  "inline-flex border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink";
const pageButtonClassName =
  "inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-surface disabled:pointer-events-none disabled:opacity-40";
/** Cells stack in a two-column grid on phones and become a table from `sm` up. */
const rowClassName = "grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-line py-4 last:border-b-0 sm:table-row";
const cellClassName = "sm:table-cell sm:py-4 sm:pr-4 sm:align-top";

type Feedback = { tone: "success" | "error"; text: string };

function InquiryPhoto({ inquiry }: { inquiry: UserInquiry }) {
  const box = "relative block size-[4.5rem] overflow-hidden rounded-xl bg-line/40";
  if (!inquiry.property) {
    return <span className={cn(box, "flex items-center justify-center text-center text-xs text-muted")}>No publicada</span>;
  }
  return (
    // Same destination as the title link: hidden from keyboard and screen readers to avoid a duplicate.
    <Link href={`/properties/${inquiry.property.id}`} tabIndex={-1} aria-hidden="true" className={box}>
      {inquiry.property.mainImageUrl ? (
        <Image src={inquiry.property.mainImageUrl} alt="" fill sizes="72px" className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-xs text-muted">Sin foto</span>
      )}
    </Link>
  );
}

function InquiryRow({ inquiry, onRemove }: { inquiry: UserInquiry; onRemove: (inquiry: UserInquiry) => void }) {
  const title = inquiryTitle(inquiry);
  return (
    <tr className={rowClassName}>
      <td className={cn(cellClassName, "row-span-3 sm:w-[5.5rem]")}>
        <InquiryPhoto inquiry={inquiry} />
      </td>
      <td className={cn(cellClassName, "sm:w-[34%]")}>
        <p className="font-medium leading-snug text-ink">
          {inquiry.property ? (
            <Link
              href={`/properties/${inquiry.property.id}`}
              className="underline decoration-brass decoration-1 underline-offset-4 hover:decoration-ink"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        <p className="mt-1 text-sm text-muted">
          {inquiry.property ? (
            <>
              <span className="font-medium text-ink/80 tabular-nums">
                {formatPrice(inquiry.property.price, inquiry.property.currency, inquiry.property.operationType)}
              </span>
              {" · "}
              {formatLocation(inquiry.property.commune, inquiry.property.city)}
            </>
          ) : (
            "Esta propiedad ya no está publicada."
          )}
        </p>
        <time dateTime={inquiry.createdAt} className="mt-1 block text-xs text-muted">
          {dateFormatter.format(new Date(inquiry.createdAt))}
        </time>
      </td>
      <td className={cn(cellClassName, "col-start-2 text-ink/85")}>
        <p className="line-clamp-3 whitespace-pre-line break-words">{inquiry.message}</p>
        {inquiry.adminReplyCount > 0 && (
          <p className="mt-2 inline-flex rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-ink">
            {inquiry.adminReplyCount === 1 ? "1 respuesta del portal" : `${inquiry.adminReplyCount} respuestas del portal`}
          </p>
        )}
      </td>
      <td className={cn(cellClassName, "col-start-2 sm:pr-0")}>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link
            href={`/account/inquiries/${inquiry.id}`}
            aria-label={`Ver la conversación sobre «${title}»`}
            className="inline-flex h-10 items-center whitespace-nowrap rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-paper"
          >
            Conversación
          </Link>
          <button
            type="button"
            onClick={() => onRemove(inquiry)}
            aria-label={`Eliminar la consulta sobre «${title}»`}
            className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-red-700 hover:text-red-700 dark:hover:border-red-400 dark:hover:text-red-400"
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function InquiryTable({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-line bg-surface px-4 shadow-soft sm:px-6">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Tus consultas</caption>
        <thead className="max-sm:sr-only">
          <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-muted">
            <th scope="col" className="py-3 pr-4 font-semibold">Foto</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Propiedad</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Mensaje enviado</th>
            <th scope="col" className="py-3 text-right font-semibold">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Inquiries the user sent, newest first: searchable table, 6 per page, each removable from the account. */
export function InquiredProperties() {
  const { data: inquiries, error, isLoading, mutate } = useMyInquiries();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  function showFeedback(next: Feedback) {
    clearTimeout(feedbackTimer.current);
    setFeedback(next);
    feedbackTimer.current = setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
  }

  async function handleRemove(inquiry: UserInquiry) {
    if (!window.confirm(`¿Eliminar tu consulta sobre «${inquiryTitle(inquiry)}»? Dejará de aparecer en tu cuenta.`)) return;

    const withoutIt = (current: UserInquiry[] | undefined) => (current ?? []).filter((item) => item.id !== inquiry.id);
    try {
      // The row leaves at once; it comes back if the API fails.
      await mutate(
        async (current) => {
          await removeMyInquiry(inquiry.id);
          return withoutIt(current);
        },
        { optimisticData: withoutIt, rollbackOnError: true, revalidate: false },
      );
      showFeedback({ tone: "success", text: "Consulta eliminada." });
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 404) {
        // Already removed (e.g. in another tab): just reload the list.
        await mutate();
        showFeedback({ tone: "success", text: "Consulta eliminada." });
        return;
      }
      showFeedback({
        tone: "error",
        text: caught instanceof ApiClientError ? caught.message : "No pudimos eliminar la consulta. Inténtalo de nuevo.",
      });
    }
  }

  if (error) {
    return (
      <div role="alert" className="rounded-[1.25rem] border border-red-300/60 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">
        <p>No pudimos cargar tus consultas. {error.message}</p>
        <button
          type="button"
          onClick={() => mutate()}
          className="mt-4 h-11 rounded-full bg-red-800 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (isLoading || !inquiries) {
    return (
      <div role="status" aria-label="Cargando tus consultas">
        <InquiryTable>
          {[0, 1, 2].map((index) => (
            <tr key={index} className={rowClassName}>
              <td className={cn(cellClassName, "row-span-2")}>
                <span className="block size-[4.5rem] animate-pulse rounded-xl bg-line/50" />
              </td>
              <td className={cellClassName}>
                <span className="block h-4 w-3/4 animate-pulse rounded bg-line/50" />
                <span className="mt-2 block h-3 w-1/2 animate-pulse rounded bg-line/40" />
              </td>
              <td className={cn(cellClassName, "col-start-2")}>
                <span className="block h-3 w-full animate-pulse rounded bg-line/40" />
              </td>
              <td className={cn(cellClassName, "hidden sm:table-cell")} />
            </tr>
          ))}
        </InquiryTable>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-line p-8 text-center">
        <p className="text-muted">Aún no has consultado por ninguna propiedad.</p>
        <Link href="/properties" className={`${linkClassName} mt-4`}>
          Ver propiedades disponibles
        </Link>
        {feedback && <p role="status" className="mt-4 text-sm font-medium text-ink">{feedback.text}</p>}
      </div>
    );
  }

  const filtered = filterInquiries(inquiries, search);
  const { items, currentPage, totalPages } = paginateInquiries(filtered, page);
  const trimmedSearch = search.trim();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="my-inquiries-search" className="sr-only">
            Buscar por título de la propiedad o texto del mensaje
          </label>
          <input
            ref={searchInput}
            id="my-inquiries-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar consultas"
            className="h-11 w-full rounded-full border border-line bg-surface px-5 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40"
          />
        </div>
        <p aria-live="polite" className="text-sm text-muted">
          {trimmedSearch
            ? `${filtered.length} de ${inquiries.length} ${inquiries.length === 1 ? "consulta" : "consultas"}`
            : `${inquiries.length} ${inquiries.length === 1 ? "consulta" : "consultas"}`}
        </p>
      </div>

      {/* Kept mounted so screen readers announce the message when it appears. */}
      <div aria-live="polite">
        {feedback && (
          <p
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-medium",
              feedback.tone === "success"
                ? "border-accent/40 bg-accent/10 text-ink"
                : "border-red-300/60 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200",
            )}
          >
            {feedback.text}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-line p-8 text-center">
          <p className="text-muted">Ninguna consulta coincide con «{trimmedSearch}».</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              // The button disappears with the empty state: keep the focus in a sensible place.
              searchInput.current?.focus();
            }}
            className={`${linkClassName} mt-4`}
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <InquiryTable>
          {items.map((inquiry) => (
            <InquiryRow key={inquiry.id} inquiry={inquiry} onRemove={handleRemove} />
          ))}
        </InquiryTable>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginación de tus consultas" className="flex items-center justify-center gap-3 pt-2">
          <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={pageButtonClassName}>
            Anterior
          </button>
          <p className="text-sm text-muted tabular-nums">
            Página {currentPage} de {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={pageButtonClassName}
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
}
