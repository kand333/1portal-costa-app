import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { addCity } from "@/services/valuation-sector-service";
import { valuationCityCreateSchema } from "@portal/shared/valuation-sector";

/** Adds a city with its base prices. ADMIN only. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = valuationCityCreateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Ciudad inválida");
    return NextResponse.json(await addCity(parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
