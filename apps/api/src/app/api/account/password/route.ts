import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { changePassword } from "@/services/account-service";
import { changePasswordSchema } from "@portal/shared/auth";

/** Changes the password of the logged-in user, after checking the current one. */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de la contraseña inválidos");

    await changePassword(user, parsed.data);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
