import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/user/library"];

const SECURITY_HEADERS = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Content-Security-Policy":
    "default-src 'self' https: data:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
    "https://apis.google.com " +
    "https://*.firebaseapp.com " +
    "https://www.googletagmanager.com " +
    "https://www.google-analytics.com; " + 
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' https: data: blob:; " +
    "font-src 'self' https: data:; " +
    "connect-src 'self' " +
    "https://*.googleapis.com " +
    "https://*.firebase.com " +
    "https://*.firebaseio.com " +
    "https://*.firebaseapp.com " +
    "https://identitytoolkit.googleapis.com " +
    "https://securetoken.googleapis.com " +
    "https://formspree.io " +
    "https://api.cloudinary.com " +
    "https://image.tmdb.org " +
    "https://www.googletagmanager.com " +
    "https://www.google-analytics.com " +
    "https://region1.google-analytics.com " +
    "frame-src 'self' " +
    "https://*.firebaseapp.com " +
    "https://accounts.google.com " +
    "https://www.youtube.com; " +
    "object-src 'none';",

  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=*, microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-XSS-Protection": "1; mode=block",
};

export default SECURITY_HEADERS;

function getSafeRedirectPath(pathname: string): string {
  if (pathname.startsWith("/") && !pathname.startsWith("//")) return pathname;
  return "/user/library";
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle Firebase action URLs
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  if (oobCode && mode === "resetPassword") {
    const url = new URL("/reset-password", request.url);
    url.searchParams.set("oobCode", oobCode);
    return NextResponse.redirect(url);
  }

  if (oobCode && mode === "verifyEmail") {
    const url = new URL("/verify-email", request.url);
    url.searchParams.set("oobCode", oobCode);
    return NextResponse.redirect(url);
  }

  const token =
    request.cookies.get("__session")?.value ||
    request.cookies.get("firebase-auth-token")?.value;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !token) {
    const redirectUrl = new URL("/user/profile", request.url);
    redirectUrl.searchParams.set("redirect", getSafeRedirectPath(pathname));
    return NextResponse.redirect(redirectUrl);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|og|.*\\..*).*)"],
};
