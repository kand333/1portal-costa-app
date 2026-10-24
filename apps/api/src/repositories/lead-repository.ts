import "server-only";
import type { LeadKind, OperationType, PropertyType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type NewLead = {
  kind: LeadKind;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  commune: string | null;
  operation: OperationType | null;
  propertyType: PropertyType | null;
  message: string | null;
  source: string;
};

export function insertLead(data: NewLead) {
  return prisma.lead.create({ data, select: { id: true, kind: true, createdAt: true } });
}

const adminLeadSelect = {
  id: true,
  kind: true,
  source: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  commune: true,
  operation: true,
  propertyType: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
} as const;

/** Every lead, newest first. */
export async function findAdminLeads(pagination: { skip: number; take: number }) {
  const [records, total] = await prisma.$transaction([
    prisma.lead.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
      select: adminLeadSelect,
    }),
    prisma.lead.count(),
  ]);
  return { records, total };
}
