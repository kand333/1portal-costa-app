import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { toErrorResponse } from "@/lib/http/api-error";
import { listFavorites } from "@/services/favorite-service";

/** Published properties saved by the logged-in user, most recent first. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["USER"]);
    return NextResponse.json(await listFavorites(user), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
