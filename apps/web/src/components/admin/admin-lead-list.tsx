import type { AdminLeadSummary } from "@portal/shared/lead";
import type { PaginatedResponse } from "@portal/shared/property";
import { Pagination } from "@/components/properties/pagination";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });
const kindLabels = { VALUATION: "Tasación", SEARCH: "Búsqueda" } as const;

type AdminLeadListProps = { result: PaginatedResponse<AdminLeadSummary>; page: number };

function leadDetail(lead: AdminLeadSummary): string {
  const parts =
    lead.kind === "VALUATION"
      ? [lead.address, lead.commune]
      : [lead.operation && operationLabels[lead.operation], lead.propertyType && propertyTypeLabels[lead.propertyType], lead.commune];
  return parts.filter(Boolean).join(" · ") || "Sin detalle";
}

export function AdminLeadList({ result, page }: AdminLeadListProps) {
  const { data, meta } = result;
  return (
    <section aria-labelledby="admin-leads-title">
      <h1 id="admin-leads-title" className="font-display text-4xl font-semibold tracking-tight text-ink">
        Leads
      </h1>
      <p className="mt-2 text-muted">Contactos captados en la portada: {meta.total}.</p>

      {data.length === 0 ? (
        <p className="mt-8 text-muted">Aún no hay solicitudes.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {data.map((lead) => (
            <li key={lead.id} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr_1fr] sm:gap-6">
              <div className="text-sm text-muted">
                <time dateTime={lead.createdAt}>{dateFormatter.format(new Date(lead.createdAt))}</time>
                <p className="mt-1 font-semibold text-ink">{kindLabels[lead.kind]}</p>
              </div>
              <div>
                <p className="font-semibold text-ink">{lead.name}</p>
                <p className="text-sm text-muted">
                  <a href={`mailto:${lead.email}`} className="border-b border-brass">
                    {lead.email}
                  </a>
                  {lead.phone ? ` · ${lead.phone}` : ""}
                </p>
                {lead.user && <p className="text-sm text-muted">Cuenta: {lead.user.name}</p>}
              </div>
              <p className="text-ink">{leadDetail(lead)}</p>
            </li>
          ))}
        </ul>
      )}

      <Pagination pathname="/admin/leads" searchParams={new URLSearchParams()} currentPage={page} totalPages={meta.totalPages} />
    </section>
  );
}
