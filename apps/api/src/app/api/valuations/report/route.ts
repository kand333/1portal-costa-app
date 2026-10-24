import type { NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { RATE_LIMITS, rateLimit } from "@/lib/http/rate-limit";
import { renderValuationReport } from "@/lib/pdf/valuation-report-pdf";
import { getUfQuote } from "@/lib/uf-value";
import { buildReportContent } from "@/services/valuation-report-data";
import { estimateValuation } from "@/services/valuation-service";
import { valuationRequestSchema } from "@portal/shared/valuation";

// pdfkit needs Node APIs.
export const runtime = "nodejs";

/**
 * PDF report of a price estimate. The estimate is computed again here from the submitted data, so the
 * figures in the document always come from the system. Nothing is stored.
 */
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
    const result = await estimateValuation(parsed.data);
    if (result.status !== "ok") {
      return errorResponse(422, "No hay datos suficientes para generar el informe de esta propiedad");
    }
    const issuedAt = new Date();
    const pdf = await renderValuationReport(buildReportContent(parsed.data, result, issuedAt, await getUfQuote()));
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="informe-de-valoracion.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
