import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { createInquiry } from "@/services/inquiry-service";
import { inquiryCreateSchema } from "@portal/shared/inquiry";

/** Creates an inquiry about a published property (visitors included). */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) {
    return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
  }

  const parsed = inquiryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de la consulta inválidos");
  }

  try {
    return Response.json(await createInquiry(parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
