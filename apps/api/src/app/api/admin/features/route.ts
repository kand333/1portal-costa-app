import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { createFeature, listFeatures } from "@/services/feature-service";
import { featureInputSchema } from "@portal/shared/feature";

/** The feature catalog, by name, with how many active properties use each one. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await listFeatures(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Adds a feature to the catalog. ADMIN only. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = featureInputSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Característica inválida");
    return NextResponse.json(await createFeature(parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
