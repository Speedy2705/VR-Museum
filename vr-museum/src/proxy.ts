import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/role-policy";

export default auth((request) => {
  if (request.auth && !request.auth.user.role) {
    const completeProfile = new URL("/complete-profile", request.nextUrl);
    completeProfile.searchParams.set(
      "returnTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(completeProfile);
  }

  if (request.auth?.user.role) {
    const path = request.nextUrl.pathname;
    const deniedPermission =
      path.startsWith("/moderation") &&
      !hasPermission(request.auth.user.role, "moderateUploads")
        ? "moderation"
        : path.startsWith("/upload") &&
            !hasPermission(request.auth.user.role, "upload")
          ? "upload"
          : null;
    if (!deniedPermission) return NextResponse.next();

    const denied = new URL("/access-denied", request.nextUrl);
    denied.searchParams.set("reason", deniedPermission);
    return NextResponse.redirect(denied);
  }

  const signIn = new URL("/sign-in", request.nextUrl);
  signIn.searchParams.set(
    "returnTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(signIn);
});

export const config = {
  matcher: [
    "/moderation/:path*",
    "/checkout/:path*",
    "/assets/:path*",
    "/support/:path*",
  ],
};
