import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { changeCityBase } from "@/services/valuation-sector-service";
import { valuationCityBaseSchema } from "@portal/shared/valuation-sector";

/** Edits the base prices (UF per square meter) of a city. ADMIN only. */
export async function PATCH(request: NextRequest, context: RouteContext<"/api/admin/valuation-sectors/cities/[id]">) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return errorResponse(400, "Identificador de ciudad inválido");
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = valuationCityBaseSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Valores inválidos");
    return NextResponse.json(await changeCityBase(id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
