import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { createProperty, listAdminProperties } from "@/services/admin-property-service";
import { adminPropertyListQuerySchema, propertyInputSchema } from "@portal/shared/admin-property";

/** Active properties (published or not) or the soft-deleted ones, with pagination and search. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const parsed = adminPropertyListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos");
    return NextResponse.json(await listAdminProperties(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Creates a property. ADMIN only. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = propertyInputSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de la propiedad inválidos");
    return NextResponse.json(await createProperty(parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
