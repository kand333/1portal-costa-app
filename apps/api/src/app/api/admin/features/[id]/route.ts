import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { removeFeature, updateFeature } from "@/services/feature-service";
import { featureIdSchema, featureInputSchema } from "@portal/shared/feature";

type FeatureContext = RouteContext<"/api/admin/features/[id]">;

const INVALID_ID = "Identificador de característica inválido";

/** Renames a feature (everywhere it is used). ADMIN only. */
export async function PUT(request: NextRequest, context: FeatureContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!featureIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = featureInputSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Característica inválida");
    return NextResponse.json(await updateFeature(id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Deletes a feature that no active property uses. ADMIN only. */
export async function DELETE(request: NextRequest, context: FeatureContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!featureIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    await removeFeature(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
