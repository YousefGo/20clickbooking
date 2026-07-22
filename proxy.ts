import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/admin-session";
import { defaultLocale, isLocale, locales } from "@/lib/i18n/config";

function detectPreferredLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  for (const lang of acceptLanguage.split(",")) {
    const code = lang.trim().split(";")[0].split("-")[0];
    if (isLocale(code)) return code;
  }

  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameLocale = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!pathnameLocale) {
    const locale = detectPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", locale, { maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  const isAdminRoute = pathname.startsWith(`/${pathnameLocale}/admin`);
  const isLoginRoute = pathname.startsWith(`/${pathnameLocale}/admin/login`);

  if (isAdminRoute && !isLoginRoute) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const isValid = token ? await verifyAdminSessionToken(token) : false;

    if (!isValid) {
      const url = request.nextUrl.clone();
      url.pathname = `/${pathnameLocale}/admin/login`;
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.cookies.set("NEXT_LOCALE", pathnameLocale, { maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.).*)"],
};
