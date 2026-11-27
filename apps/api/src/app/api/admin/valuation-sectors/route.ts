import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { addSector, listReferenceTable } from "@/services/valuation-sector-service";
import { valuationSectorCreateSchema } from "@portal/shared/valuation-sector";

/** The reference table of the price estimator: cities with their base prices and sectors. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await listReferenceTable(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Adds a sector to a city. ADMIN only. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = valuationSectorCreateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Sector inválido");
    return NextResponse.json(await addSector(parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
