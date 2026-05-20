import { NextRequest, NextResponse } from "next/server";

const BAD_BOTS =
  /crawler|spider|scraper|go-http|libwww|python-requests|curl|wget|java\/|ruby|perl|php|bot(?!tle)/i;

const SOCIAL_CRAWLERS =
  /facebookexternalhit|twitterbot|telegrambot|whatsapp|linkedinbot|slackbot|discordbot|applebot|googlebot|bingbot/i;

function isBadBot(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  const host = req.headers.get("host") ?? "";

  // Never block local development
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return false;
  }

  // Allow legitimate crawlers
  if (SOCIAL_CRAWLERS.test(ua)) {
    return false;
  }

  // Empty UA is suspicious
  if (!ua.trim()) {
    return true;
  }

  return BAD_BOTS.test(ua);
}

const SECURITY_HEADERS: Record<string, string> = {
  // Existing
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "X-XSS-Protection": "0",

  // Added
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "same-origin",

  // Safer CSP without breaking current site
  "Content-Security-Policy": [
    "default-src 'self'",
    "img-src 'self' data: https:",
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

function applyHeaders(res: NextResponse) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }

  return res;
}

export default function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isRSC = req.headers.has("rsc") || searchParams.has("_rsc");

  if (isRSC) {
    return NextResponse.next();
  }

  // Bot filtering
  if (isBadBot(req)) {
    return new NextResponse("Forbidden", {
      status: 403,
    });
  }

  const response = NextResponse.next();

  return applyHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
