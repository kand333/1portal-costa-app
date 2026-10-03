import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { replyAsUser } from "@/services/inquiry-conversation-service";
import { inquiryIdSchema, inquiryReplySchema } from "@portal/shared/inquiry";

/** The user answers in the conversation of one of their inquiries. USER accounts only. */
export async function POST(request: NextRequest, context: RouteContext<"/api/account/inquiries/[id]/messages">) {
  try {
    const user = await requireRole(request, ["USER"]);
    const { id } = await context.params;
    if (!inquiryIdSchema.safeParse(id).success) return errorResponse(400, "Identificador de consulta inválido");
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = inquiryReplySchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Respuesta inválida");
    return NextResponse.json(await replyAsUser(user, id, parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
