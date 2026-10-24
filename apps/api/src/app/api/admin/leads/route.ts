import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { listAdminLeads } from "@/services/lead-service";
import { adminLeadListQuerySchema } from "@portal/shared/lead";

/** Every lead captured on the home page, newest first, with pagination. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const parsed = adminLeadListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos");
    return NextResponse.json(await listAdminLeads(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
