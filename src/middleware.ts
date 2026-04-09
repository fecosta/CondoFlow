import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { getDashboardRoute } from "@/lib/permissions";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/permissions";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (!session) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in and hitting a public route → redirect to dashboard
  if (isPublic) {
    const role = session.user.role as UserRole;
    return NextResponse.redirect(new URL(getDashboardRoute(role), nextUrl.origin));
  }

  const role = session.user.role as UserRole;

  // Role-based route protection
  if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(getDashboardRoute(role), nextUrl.origin));
  }

  if (pathname.startsWith("/sindico") && role !== "SINDICO" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(getDashboardRoute(role), nextUrl.origin));
  }

  if (pathname.startsWith("/portaria") && role !== "PORTEIRO" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(getDashboardRoute(role), nextUrl.origin));
  }

  if (pathname.startsWith("/morador") && role !== "MORADOR" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(getDashboardRoute(role), nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
