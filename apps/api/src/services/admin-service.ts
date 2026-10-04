import "server-only";
import { countDashboardIndicators } from "@/repositories/admin-repository";
import type { AdminDashboardStats } from "@portal/shared/admin";

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const { total, published, forSale, forRent, users, inquiries } = await countDashboardIndicators();
  return { properties: { total, published, forSale, forRent }, users, inquiries };
}
