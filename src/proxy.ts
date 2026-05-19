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

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

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

// ─── Security headers ────────────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-XSS-Protection": "0",
};

// ─── Helpers ─────────────────────────────────────────────────────
function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

// ─── Middleware ──────────────────────────────────────────────────
export default function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Allow static + Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Block bad bots (only for real page traffic)
  if (isBadBot(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3. Skip ALL RSC requests (VERY IMPORTANT FIX)
  const isRSC = req.headers.has("rsc") || searchParams.has("_rsc");

  if (isRSC) {
    return NextResponse.next();
  }

  // 4. Rate limit ONLY API routes (CRITICAL FIX)
  const isAPI = pathname.startsWith("/api");

  if (isAPI) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  }

  // 5. CSRF protection (API only) - but allow same-site requests
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);

  if (isAPI && isMutating) {
    const origin = req.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Only validate origin if it's provided and NEXT_PUBLIC_APP_URL is set
    if (origin && appUrl) {
      // Normalize URLs for comparison (remove trailing slash)
      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedAppUrl = appUrl.replace(/\/$/, "");

      if (normalizedOrigin !== normalizedAppUrl) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

// ─── Matcher ─────────────────────────────────────────────────────
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
