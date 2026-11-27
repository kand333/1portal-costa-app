import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { changeSector } from "@/services/valuation-sector-service";
import { valuationSectorUpdateSchema } from "@portal/shared/valuation-sector";

/** Edits a sector: coefficient, centre, note and source. ADMIN only. */
export async function PATCH(request: NextRequest, context: RouteContext<"/api/admin/valuation-sectors/[id]">) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return errorResponse(400, "Identificador de sector inválido");
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = valuationSectorUpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Sector inválido");
    return NextResponse.json(await changeSector(id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
