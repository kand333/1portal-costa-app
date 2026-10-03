import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { toErrorResponse } from "@/lib/http/api-error";
import { listUserInquiries } from "@/services/inquiry-service";

/** Inquiries sent by the logged-in user, newest first. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["USER"]);
    return NextResponse.json(await listUserInquiries(user), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
