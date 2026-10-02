import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session-cookie";

/** Ends the session by removing its cookie. Succeeds even without a session. */
export function POST() {
  return clearSessionCookie(new NextResponse(null, { status: 204 }));
}
