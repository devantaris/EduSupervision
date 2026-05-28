import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route Guard Middleware
 *
 * Checks that a refresh_token cookie exists before allowing access to
 * protected routes. Actual JWT signature verification is handled by the
 * FastAPI backend on every authenticated API call — the Edge only needs
 * to know whether a session cookie is present.
 *
 * Role-specific guards (e.g. Teacher vs Admin) are enforced server-side
 * by FastAPI's require_role() dependency.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("refresh_token");
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/teacher");
  const isAuthPage =
    pathname === "/login" || pathname.startsWith("/register");

  // 1. Block protected pages when no session
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect logged-in users away from auth pages to home
  //    (let the dashboard pages themselves handle the correct redirect after API load)
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/login",
    "/register/:path*",
  ],
};
