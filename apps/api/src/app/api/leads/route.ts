import type { NextRequest } from "next/server";
import { getOptionalUser } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { RATE_LIMITS, rateLimit } from "@/lib/http/rate-limit";
import { createLead } from "@/services/lead-service";
import { leadCreateSchema } from "@portal/shared/lead";

/** Captures a lead from the home page. Visitors included; with a session it is linked to the user. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, RATE_LIMITS.lead);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) {
    return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
  }

  const parsed = leadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de la solicitud inválidos");
  }

  // Honeypot: a bot filled the hidden field. Answer as if it worked, store nothing.
  if (parsed.data.website) {
    return Response.json(
      { id: crypto.randomUUID(), kind: parsed.data.kind, createdAt: new Date().toISOString() },
      { status: 201 },
    );
  }

  try {
    const user = await getOptionalUser(request);
    return Response.json(await createLead(parsed.data, user), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
