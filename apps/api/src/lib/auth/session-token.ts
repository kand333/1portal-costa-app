import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequiredEnvironmentVariable } from "@/lib/environment";

export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const MIN_SECRET_LENGTH = 32;

type SessionPayload = {
  /** User id. */
  sub: string;
  /** Expiration, in seconds since the epoch. */
  exp: number;
};

function getSecret(): string {
  const secret = getRequiredEnvironmentVariable("AUTH_SECRET");
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must have at least ${MIN_SECRET_LENGTH} characters`);
  }
  return secret;
}

const sign = (encodedPayload: string, secret: string) =>
  createHmac("sha256", secret).update(encodedPayload).digest("base64url");

/**
 * Session token "payload.signature": the user id and expiration, signed with HMAC-SHA256 and the
 * server secret. It travels only in an httpOnly cookie, never in storage the page can read.
 */
export function createSessionToken(userId: string, now = Date.now()): string {
  const payload: SessionPayload = { sub: userId, exp: Math.floor(now / 1000) + SESSION_DURATION_SECONDS };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, getSecret())}`;
}

/** Returns the user id of a valid, unexpired token, or null for anything else. */
export function readSessionToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(encodedPayload, getSecret()));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    return payload.exp > Math.floor(now / 1000) ? payload.sub : null;
  } catch {
    return null;
  }
}
