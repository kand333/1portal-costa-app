import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { getAdminProperty, removeProperty, updateProperty } from "@/services/admin-property-service";
import { propertyInputSchema } from "@portal/shared/admin-property";
import { propertyIdSchema } from "@portal/shared/property-query";

type AdminPropertyContext = RouteContext<"/api/admin/properties/[id]">;

const INVALID_ID = "Identificador de propiedad inválido";

/** A property, published or not. ADMIN only. */
export async function GET(request: NextRequest, context: AdminPropertyContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!propertyIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    return NextResponse.json(await getAdminProperty(id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Replaces every field and the features of a property. ADMIN only. */
export async function PUT(request: NextRequest, context: AdminPropertyContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!propertyIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = propertyInputSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de la propiedad inválidos");
    return NextResponse.json(await updateProperty(id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Deletes a property. ADMIN only. */
export async function DELETE(request: NextRequest, context: AdminPropertyContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!propertyIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    await removeProperty(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
