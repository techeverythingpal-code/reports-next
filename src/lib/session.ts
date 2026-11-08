import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { supervisors, users } from "@/db/schema";
import {
  readSessionToken,
  SESSION_COOKIE,
  SESSION_HOURS,
  signSession,
  type SessionPayload,
} from "./session-token";

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type CurrentUser =
  | { kind: "admin"; id: number; name: string; email: string }
  | {
      kind: "supervisor";
      id: number;
      name: string;
      directorateId: number;
      mustChangePassword: boolean;
    };

// Reads the cookie AND re-checks the account in the database, so a deleted
// supervisor or a changed flag takes effect immediately. Cached per request.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  if (session.kind === "admin") {
    const admin = await db.query.users.findFirst({ where: eq(users.id, session.id) });
    return admin ? { kind: "admin", id: admin.id, name: admin.name, email: admin.email } : null;
  }

  const sup = await db.query.supervisors.findFirst({ where: eq(supervisors.id, session.id) });
  return sup
    ? {
        kind: "supervisor",
        id: sup.id,
        name: sup.name ?? "",
        directorateId: sup.directorateId,
        mustChangePassword: sup.mustChangePassword,
      }
    : null;
});

// Use at the top of every protected page and server action.
// Same rules as Laravel's auth + password.changed middleware.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.kind === "supervisor" && user.mustChangePassword) redirect("/password/change");
  return user;
}

// Same rule as Laravel's AdminMiddleware.
export async function requireAdmin() {
  const user = await requireUser();
  if (user.kind !== "admin") redirect("/dashboard?error=forbidden");
  return user;
}
