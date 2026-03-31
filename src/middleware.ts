// middleware.ts (root level — Next.js picks it up automatically)
// -------------------------------------------------
// Decision: Middleware runs on the Edge before any
// page renders. It checks for the auth-token cookie
// (set by auth.service.ts on login/signup) and
// redirects unauthenticated users to /login.
// Role-based redirects are handled client-side by
// RouteGuard to avoid decoding JWTs in the Edge runtime.
// -------------------------------------------------

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/admin", "/teacher", "/student", "/dashboard"];

// Routes only for unauthenticated users (redirect away if logged in)
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Not authenticated → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated → redirect away from login/register
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/student", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
