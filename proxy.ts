import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only (Next.js 16 Proxy): visitors without the signed-in hint cookie are sent
 * to /login before the page renders. The real check happens client-side against the API.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.get("hvk_signed_in")?.value === "1") return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard",
    "/onboarding",
    "/payment",
    "/exam/:path*",
    "/feedback",
    "/thank-you",
    "/result",
    "/profile",
    "/admin/:path*",
  ],
};
