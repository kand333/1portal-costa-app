import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { getUserInquiry } from "@/services/inquiry-conversation-service";
import { removeUserInquiry } from "@/services/inquiry-service";
import { inquiryIdSchema } from "@portal/shared/inquiry";

type AccountInquiryContext = RouteContext<"/api/account/inquiries/[id]">;

const INVALID_ID = "Identificador de consulta inválido";

/** One of the user's inquiries with its conversation. USER accounts only. */
export async function GET(request: NextRequest, context: AccountInquiryContext) {
  try {
    const user = await requireRole(request, ["USER"]);
    const { id } = await context.params;
    if (!inquiryIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    return NextResponse.json(await getUserInquiry(user, id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Removes one of the user's inquiries from their account (ADMIN keeps it). */
export async function DELETE(request: NextRequest, context: AccountInquiryContext) {
  try {
    const user = await requireRole(request, ["USER"]);
    const { id } = await context.params;
    if (!inquiryIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    await removeUserInquiry(user, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
