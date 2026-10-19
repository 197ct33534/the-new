import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { UserRole } from "@prisma/client";

import { getAuthSecret } from "@/lib/auth-secret";
import { routing, signInPathForLocale } from "./i18n/routing";

type TokenWithRole = { role?: UserRole };

const intlMiddleware = createMiddleware(routing);

const STAFF_ROLES = new Set<string>(["CONTRIBUTOR", "AUTHOR", "EDITOR", "ADMIN"]);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/feed") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: getAuthSecret(),
    });
    const role = (token as TokenWithRole | null)?.role;
    if (!token || !role || !STAFF_ROLES.has(role)) {
      const loc = request.cookies.get("NEXT_LOCALE")?.value;
      const signPath = signInPathForLocale(loc);
      const signInUrl = new URL(signPath, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
