import "server-only";
import { prisma } from "@/lib/prisma";

/** Counts for the ADMIN dashboard, computed in PostgreSQL in a single transaction. Soft-deleted properties do not count. */
export async function countDashboardIndicators() {
  const active = { deletedAt: null };
  const [total, published, forSale, forRent, users, inquiries] = await prisma.$transaction([
    prisma.property.count({ where: active }),
    prisma.property.count({ where: { ...active, isPublished: true } }),
    prisma.property.count({ where: { ...active, operationType: "SALE" } }),
    prisma.property.count({ where: { ...active, operationType: "RENT" } }),
    prisma.user.count(),
    prisma.inquiry.count(),
  ]);
  return { total, published, forSale, forRent, users, inquiries };
}
