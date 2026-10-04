import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { getAdminInquiry } from "@/services/inquiry-conversation-service";
import { inquiryIdSchema } from "@portal/shared/inquiry";

/** An inquiry with its conversation. ADMIN only. */
export async function GET(request: NextRequest, context: RouteContext<"/api/admin/inquiries/[id]">) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!inquiryIdSchema.safeParse(id).success) return errorResponse(400, "Identificador de consulta inválido");
    return NextResponse.json(await getAdminInquiry(id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
