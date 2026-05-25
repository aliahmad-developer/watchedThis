import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:auth",
});

const RATE_LIMITED_ROUTES = [
  "/api/auth/resetPassword",
  "/api/auth/sendVerification",
  "/api/auth/confirmReset",
  "/api/auth/confirmSignUp",
];

const BAD_BOTS =
  /crawler|spider|scraper|go-http|libwww|python-requests|curl|wget|java\/|ruby|perl|php|bot(?!tle)/i;

const SOCIAL_CRAWLERS =
  /facebookexternalhit|twitterbot|telegrambot|whatsapp|linkedinbot|slackbot|discordbot|applebot|googlebot|bingbot/i;

const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "X-XSS-Protection": "0",
  // FIX 1: Changed from "same-origin" to "same-origin-allow-popups" to allow
  // Firebase popup-based auth flows (window.closed calls were being blocked).
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "cross-origin",

  "Content-Security-Policy": [
    "default-src 'self'",

    // scripts (Google One Tap + GTM)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.google.com https://www.googletagmanager.com https://tagmanager.google.com",

    // styles
    "style-src 'self' 'unsafe-inline' https:",

    // images
    "img-src 'self' data: blob: https:",

    // API / auth calls (GTM + Google services + Firebase)
    "connect-src 'self' https: wss: https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://www.googletagmanager.com https://region1.google-analytics.com https://www.google-analytics.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",

    // FIX 2: Added https://fyp-movie-4d46d.firebaseapp.com (and wildcard fallback)
    // to allow Firebase auth iframe used for session management and token refresh.
    "frame-src 'self' https://accounts.google.com https://www.google.com https://www.googletagmanager.com https://fyp-movie-4d46d.firebaseapp.com https://*.firebaseapp.com",

    "font-src 'self' https: data:",
    "media-src 'self' https:",
    "object-src 'none'",

    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
};

function isBadBot(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  const host = req.headers.get("host") ?? "";

  if (host.includes("localhost") || host.includes("127.0.0.1")) return false;
  if (SOCIAL_CRAWLERS.test(ua)) return false;
  if (!ua.trim()) return true;

  return BAD_BOTS.test(ua);
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1"
  );
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api");
  const isRSC = req.headers.has("rsc") || req.nextUrl.searchParams.has("_rsc");

  // Rate limit auth routes
  if (RATE_LIMITED_ROUTES.some((r) => pathname.startsWith(r))) {
    const ip = getIP(req);
    const { success, limit, remaining, reset } = await authRatelimit.limit(ip);

    if (!success) {
      const res = new NextResponse("Too many requests", { status: 429 });
      res.headers.set("X-RateLimit-Limit", String(limit));
      res.headers.set("X-RateLimit-Remaining", String(remaining));
      res.headers.set("X-RateLimit-Reset", String(reset));
      return res;
    }
  }

  // Block bad bots (non-API)
  if (!isApi && isBadBot(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Allow API/RSC with headers only
  if (isApi || isRSC) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Block again for page requests
  if (isBadBot(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Protected route example
  if (pathname.startsWith("/user/library")) {
    const session = req.cookies.get("__session")?.value;
    if (!session) {
      const loginUrl = new URL("/user/profile", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
