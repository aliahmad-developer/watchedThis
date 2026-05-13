import { NextRequest, NextResponse } from "next/server";

// ─── Bot Detection ────────────────────────────────────────────────────────────
const BAD_BOTS =
  /crawler|spider|scraper|go-http|libwww|python-requests|curl|wget|axios|java\/|ruby|perl|php|bot(?!tle)/i;

function isBadBot(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  const host = req.headers.get("host") ?? "";

  if (host.includes("localhost") || host.includes("127.0.0.1")) return false;

  if (ua.trim() === "" || BAD_BOTS.test(ua)) return true;

  return false;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROTECTED_ROUTES = ["/user/library"];
const AUTH_REDIRECT = "/user/profile";
const SAFE_FALLBACK = "/";

const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-XSS-Protection": "0",
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
    "https://image.tmdb.org " +
    "https://www.googletagmanager.com " +
    "https://www.google-analytics.com " +
    "https://region1.google-analytics.com; " +
    "frame-src 'self' " +
    "https://*.firebaseapp.com " +
    "https://accounts.google.com " +
    "https://www.youtube.com; " +
    "object-src 'none';",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSafeRedirectPath(pathname: string): string {
  if (pathname.startsWith("/") && !pathname.startsWith("//")) return pathname;
  return SAFE_FALLBACK;
}

function looksLikeJWT(token: string): boolean {
  return /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token);
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Pass RSC requests straight through
  if (request.headers.has("rsc") || searchParams.has("_rsc")) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Block bad bots
  if (isBadBot(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  if (oobCode && mode === "verifyEmail") {
    const url = new URL("/verify-email", request.url);
    url.searchParams.set("oobCode", oobCode);
    return NextResponse.redirect(url);
  }

  // 4. Protected route guard
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected) {
    const rawToken =
      request.cookies.get("__session")?.value ??
      request.cookies.get("firebase-auth-token")?.value;

    if (!rawToken || !looksLikeJWT(rawToken)) {
      const redirectUrl = new URL(AUTH_REDIRECT, request.url);
      redirectUrl.searchParams.set("redirect", getSafeRedirectPath(pathname));
      return NextResponse.redirect(redirectUrl);
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|og|api/|.*\\..*).*)"],
};
