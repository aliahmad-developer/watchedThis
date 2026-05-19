import { NextRequest, NextResponse } from "next/server";

const BAD_BOTS =
  /crawler|spider|scraper|go-http|libwww|python-requests|curl|wget|axios|java\/|ruby|perl|php|bot(?!tle)/i;

const SOCIAL_CRAWLERS =
  /facebookexternalhit|twitterbot|telegrambot|whatsapp|linkedinbot|slackbot|discordbot|applebot|googlebot|bingbot/i;

function isBadBot(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  const host = req.headers.get("host") ?? "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) return false;
  if (SOCIAL_CRAWLERS.test(ua)) return false;
  if (ua.trim() === "" || BAD_BOTS.test(ua)) return true;
  return false;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROTECTED_ROUTES = ["/user/library"];
const AUTH_REDIRECT = "/user/profile";
const SAFE_FALLBACK = "/";

// Allowed origins for CSRF checks. Add your production domain(s) here.
const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL ?? "",
  "http://localhost:3000",
]);

// Simple in-memory rate limiter.
// IMPORTANT: Replace with Upstash Ratelimit (or equivalent) for multi-instance
// / serverless deployments — in-memory state does not persist across Edge
// function invocations.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

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
    "https://accounts.google.com " + // ← One Tap GSI script
    "https://*.firebaseapp.com " +
    "https://www.googletagmanager.com " +
    "https://www.google-analytics.com; " +
    "style-src 'self' 'unsafe-inline' " +
    "https://accounts.google.com; " + // ← One Tap injects styles
    "img-src 'self' https: data: blob:; " +
    "font-src 'self' https: data:; " +
    "connect-src 'self' " +
    "https://*.googleapis.com " +
    "https://*.firebase.com " +
    "https://*.firebaseio.com " +
    "https://*.firebaseapp.com " +
    "https://identitytoolkit.googleapis.com " +
    "https://securetoken.googleapis.com " +
    "https://accounts.google.com " + // ← One Tap token exchange
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

/**
 * FIX (Medium): looksLikeJWT() was the only guard — any three-segment string
 * passed. Middleware runs on the Edge and cannot call firebase-admin, so we
 * keep the structural check here but treat it only as "token is present and
 * structurally plausible". Actual cryptographic verification MUST happen in
 * every API route handler via firebase-admin verifyIdToken(). Do not trust
 * this check alone for authorization decisions.
 */
function hasPlausibleJWT(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  // Each part must be non-empty base64url
  return parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p) && p.length > 0);
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * FIX (High): CSRF origin check for state-mutating methods.
 * Returns true (i.e. "block this request") when the Origin/Referer header
 * is present but does not match an allowed origin.
 */
function isCsrfViolation(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const source = origin ?? (referer ? new URL(referer).origin : null);

  // If neither header is present we cannot determine origin — allow through
  // (browser-initiated same-site requests often omit Origin for GETs).
  if (!source) return false;

  return !ALLOWED_ORIGINS.has(source);
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

  // FIX (High): Rate limiting — applied per IP before any auth logic.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  // FIX (High): CSRF protection for mutating requests.
  if (isCsrfViolation(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3. Firebase email verification redirect
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
    // FIX (Medium): Use __session (HttpOnly cookie set server-side) as the
    // authoritative session token. The old firebase-auth-token cookie was
    // set by document.cookie in the browser and could never be HttpOnly.
    const rawToken = request.cookies.get("__session")?.value;

    if (!rawToken || !hasPlausibleJWT(rawToken)) {
      const redirectUrl = new URL(AUTH_REDIRECT, request.url);
      redirectUrl.searchParams.set("redirect", getSafeRedirectPath(pathname));
      return NextResponse.redirect(redirectUrl);
    }
    // NOTE: Verify rawToken with firebase-admin verifyIdToken() inside the
    // API route / server action that handles the protected data. Middleware
    // only confirms a token is present and structurally valid.
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|og/?|api/|.*\\..*).*)",
  ],
};
