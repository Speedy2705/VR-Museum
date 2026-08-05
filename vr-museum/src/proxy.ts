import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/role-policy";
import { defaultLocale, isLocale, localeFromPathname, localizePath } from "@/lib/i18n";

export default auth((request) => {
  const originalPath = request.nextUrl.pathname;
  const savedLocale = request.cookies.get("museum-locale")?.value;
  const sessionLocale = request.auth?.user.locale;
  const locale = localeFromPathname(originalPath) ?? (isLocale(savedLocale) ? savedLocale : isLocale(sessionLocale) ? sessionLocale : defaultLocale);
  const isPublicFile = /\.[^/]+$/.test(originalPath);
  if (!localeFromPathname(originalPath) && !originalPath.startsWith("/api/") && !originalPath.startsWith("/_next/") && !isPublicFile) {
    return NextResponse.redirect(new URL(localizePath(`${originalPath}${request.nextUrl.search}`, locale), request.nextUrl));
  }
  const path = localeFromPathname(originalPath)
    ? originalPath.slice(locale.length + 1) || "/"
    : originalPath;
  const localized = (target: string) => localizePath(target, locale);

  if (request.auth && !request.auth.user.role) {
    const completeProfile = new URL(localized("/complete-profile"), request.nextUrl);
    completeProfile.searchParams.set(
      "returnTo",
      `${originalPath}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(completeProfile);
  }

  if (request.auth?.user.role) {
    const deniedPermission =
      path.startsWith("/moderation") &&
      !hasPermission(request.auth.user.role, "moderateUploads")
        ? "moderation"
        : path.startsWith("/upload") &&
            !hasPermission(request.auth.user.role, "upload")
          ? "upload"
          : null;
    if (!deniedPermission) {
      if (!localeFromPathname(originalPath)) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = path;
      const headers = new Headers(request.headers);
      headers.set("x-museum-locale", locale);
      return NextResponse.rewrite(url, { request: { headers } });
    }

    const denied = new URL(localized("/access-denied"), request.nextUrl);
    denied.searchParams.set("reason", deniedPermission);
    return NextResponse.redirect(denied);
  }

  const protectedPath = ["/moderation", "/upload", "/checkout", "/assets", "/support"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  if (!protectedPath) {
    if (!localeFromPathname(originalPath)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = path;
    const headers = new Headers(request.headers);
    headers.set("x-museum-locale", locale);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const signIn = new URL(localized("/sign-in"), request.nextUrl);
  signIn.searchParams.set(
    "returnTo",
    `${originalPath}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(signIn);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|uploads).*)",
  ],
};
