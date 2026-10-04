import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { listAdminInquiries } from "@/services/inquiry-conversation-service";
import { adminInquiryListQuerySchema } from "@portal/shared/inquiry";

/** Every inquiry, newest first, with pagination and search. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const parsed = adminInquiryListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos");
    return NextResponse.json(await listAdminInquiries(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
