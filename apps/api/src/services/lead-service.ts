import "server-only";
import { findAdminLeads, insertLead } from "@/repositories/lead-repository";
import type { AuthUser } from "@portal/shared/auth";
import type { AdminLeadListQuery, AdminLeadSummary, LeadCreateData, LeadCreated } from "@portal/shared/lead";
import type { PaginatedResponse } from "@portal/shared/property";

/**
 * Stores a lead captured on the home page. It is saved before any email is sent (the browser sends it
 * through Web3Forms afterwards), so an email failure never loses it.
 */
export async function createLead(data: LeadCreateData, user: AuthUser | null = null): Promise<LeadCreated> {
  const lead = await insertLead({
    kind: data.kind,
    userId: user?.id ?? null,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    address: data.address ?? null,
    commune: data.commune ?? null,
    operation: data.operation ?? null,
    propertyType: data.propertyType ?? null,
    message: data.message ?? null,
    source: data.source,
  });
  return { id: lead.id, kind: lead.kind, createdAt: lead.createdAt.toISOString() };
}

export async function listAdminLeads(query: AdminLeadListQuery): Promise<PaginatedResponse<AdminLeadSummary>> {
  const { page, pageSize } = query;
  const { records, total } = await findAdminLeads({ skip: (page - 1) * pageSize, take: pageSize });
  return {
    data: records.map((lead) => ({ ...lead, createdAt: lead.createdAt.toISOString() })),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
