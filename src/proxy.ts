import { NextRequest, NextResponse } from "next/server";
// ─── Rate Limiting ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

// ─── Bot Detection ────────────────────────────────────────────────────────────
const BAD_BOTS =
  /bot|crawler|spider|scraper|curl|wget|python|go-http|java|libwww/i;

function isBadBot(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") || "";
  return BAD_BOTS.test(ua) || ua.trim() === "";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROTECTED_ROUTES = ["/user/library"];

const SECURITY_HEADERS: Record<string, string> = {
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
    "https://region1.google-analytics.com; " +
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Middleware ───────────────────────────────────────────────────────────────
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Get IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 2. Block bad bots
  if (isBadBot(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3. Rate limit — stricter for /api routes
  const isApiRoute = pathname.startsWith("/api/");
  if (isApiRoute && isRateLimited(`api:${ip}`,120, 60_000)) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }
  if (!isApiRoute && isRateLimited(ip, 200, 60_000)) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // 4. Firebase action URLs
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

  // 5. Protected route guard
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

  // 6. Apply security headers and pass through
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|og|.*\\..*).*)"],
};