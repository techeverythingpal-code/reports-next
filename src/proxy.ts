import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session-token";

// Fast first check: send signed-out visitors to /login before rendering.
// This only reads the cookie. The real checks (account still exists, role,
// forced password change) happen in requireUser()/requireAdmin() on every
// page and server action.
const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  if (session.mustChangePassword && pathname !== "/password/change") {
    return NextResponse.redirect(new URL("/password/change", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files in /public.
  matcher: ["/((?!_next/|images/|fonts/|favicon.ico).*)"],
};
