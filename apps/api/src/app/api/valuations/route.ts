import type { NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { RATE_LIMITS, rateLimit } from "@/lib/http/rate-limit";
import { estimateValuation } from "@/services/valuation-service";
import { valuationRequestSchema } from "@portal/shared/valuation";

/** Free price estimate from comparable published properties. Public; nothing is stored. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, RATE_LIMITS.valuation);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) {
    return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
  }

  const parsed = valuationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de la tasación inválidos");
  }

  try {
    return Response.json(await estimateValuation(parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
