import { NextRequest, NextResponse } from "next/server";

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
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "same-origin",

  "Content-Security-Policy": [
    "default-src 'self'",

    // Allow normal + blob images
    "img-src 'self' data: blob: https:",

    "media-src 'self' https:",
    "frame-src 'self' https:",
    "font-src 'self' https: data:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https: wss:",

    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};
// Routes that require a valid session cookie
const PROTECTED_ROUTES = ["/user/settings", "/user/lists"];

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

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Always skip static assets — no headers needed, no bot check
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ✅ Skip bot filtering for API routes and RSC — apply headers only
  const isApi = pathname.startsWith("/api");
  const isRSC = req.headers.has("rsc") || req.nextUrl.searchParams.has("_rsc");

  if (isApi || isRSC) {
    return applySecurityHeaders(NextResponse.next());
  }

  // ✅ Bot filtering for all page routes
  if (isBadBot(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ✅ Auth guard for protected routes
  if (isProtected(pathname)) {
    const session = req.cookies.get("__session")?.value;

    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
