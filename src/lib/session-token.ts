// Signing/verifying the login cookie. Kept free of Node-only imports so the
// proxy (route guard) can use it too.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "reports_session";
export const SESSION_HOURS = 2; // same as Laravel's SESSION_LIFETIME=120

export type SessionPayload = {
  kind: "admin" | "supervisor";
  id: number;
  name: string;
  mustChangePassword: boolean;
};

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters. See .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(key());
}

export async function readSessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const { kind, id, name, mustChangePassword } = payload as Partial<SessionPayload>;
    if ((kind !== "admin" && kind !== "supervisor") || typeof id !== "number") return null;
    return { kind, id, name: name ?? "", mustChangePassword: Boolean(mustChangePassword) };
  } catch {
    return null;
  }
}
