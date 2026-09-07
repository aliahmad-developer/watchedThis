import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createServerClient } from "@supabase/ssr";

/* =========================================================
   LAZY UPSTASH REDIS / RATE LIMITER
   ========================================================= */

let authRatelimit: Ratelimit | null = null;

function getAuthRatelimit(): Ratelimit {
  if (!authRatelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    authRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:auth",
    });
  }

  return authRatelimit;
}

/* =========================================================
   RATE LIMITED ROUTES
   ========================================================= */

const RATE_LIMITED_ROUTES = [
  "/api/auth/resetPassword",
  "/api/auth/sendVerification",
  "/api/auth/confirmReset",
  "/api/auth/confirmSignUp",
];

/* =========================================================
   BOT DETECTION
   ========================================================= */

const BAD_BOTS =
  /crawler|spider|scraper|go-http|libwww|python-requests|curl|wget|java\/|ruby|perl|php|bot(?!tle)/i;

const SOCIAL_CRAWLERS =
  /facebookexternalhit|twitterbot|telegrambot|whatsapp|linkedinbot|slackbot|discordbot|applebot|googlebot|bingbot/i;

/* =========================================================
   ENVIRONMENT
   ========================================================= */

const isProd = process.env.NODE_ENV === "production";

/* =========================================================
   SECURITY HEADERS
   ========================================================= */

const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",

  "X-Frame-Options": "SAMEORIGIN",

  "X-Content-Type-Options": "nosniff",

  "Referrer-Policy": "strict-origin-when-cross-origin",

  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",

  "X-XSS-Protection": "0",

  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",

  "Cross-Origin-Resource-Policy": "cross-origin",

  "Content-Security-Policy": [
    "default-src 'self'",
    [
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "https://accounts.google.com",
      "https://apis.google.com",
      "https://www.google.com",
      "https://www.googletagmanager.com",
      "https://tagmanager.google.com",
      "https://www.youtube.com",
      "https://s.ytimg.com",
      "https://static.cloudflareinsights.com",
    ].join(" "),
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    [
      "connect-src 'self'",
      "https://accounts.google.com",
      "https://oauth2.googleapis.com",
      "https://www.googleapis.com",
      "https://www.googletagmanager.com",
      "https://region1.google-analytics.com",
      "https://www.google-analytics.com",
      "https://static.cloudflareinsights.com",
      "https://*.supabase.co",
      "wss://*.supabase.co",
    ].join(" "),
    [
      "frame-src 'self'",
      "https://accounts.google.com",
      "https://www.google.com",
      "https://www.googletagmanager.com",
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      "https://youtube.com",
    ].join(" "),
    "font-src 'self' https: data:",
    "media-src 'self' https:",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; "),
};

/* =========================================================
   BOT CHECK
   ========================================================= */

function isBadBot(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  const host = req.headers.get("host") ?? "";

  // Never block local development
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return false;
  }

  // Allow legitimate social-media crawlers
  if (SOCIAL_CRAWLERS.test(ua)) {
    return false;
  }

  // Block requests without a User-Agent
  if (!ua.trim()) {
    return true;
  }

  return BAD_BOTS.test(ua);
}

/* =========================================================
   SECURITY HEADER HELPER
   ========================================================= */

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }

  return res;
}

/* =========================================================
   GET CLIENT IP
   ========================================================= */

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1"
  );
}

/* =========================================================
   MIDDLEWARE
   ========================================================= */

export default async function middleware(req: NextRequest) {
  /* =======================================================
     CANONICAL DOMAIN
     ======================================================= */

  // Redirect www → non-www
  // This prevents split sessions and duplicate SEO URLs.
  if (req.nextUrl.hostname === "www.watchedthis.com") {
    const canonicalUrl = req.nextUrl.clone();

    canonicalUrl.hostname = "watchedthis.com";

    return NextResponse.redirect(canonicalUrl, 301);
  }

  const { pathname } = req.nextUrl;

  /* =======================================================
     SKIP STATIC ASSETS
     ======================================================= */

  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  /* =======================================================
     REQUEST TYPE
     ======================================================= */

  const isApi = pathname.startsWith("/api");

  const isRSC = req.headers.has("rsc") || req.nextUrl.searchParams.has("_rsc");

  /* =======================================================
     AUTH RATE LIMITING
     ======================================================= */

  if (RATE_LIMITED_ROUTES.some((route) => pathname.startsWith(route))) {
    try {
      const ip = getIP(req);

      const { success, limit, remaining, reset } =
        await getAuthRatelimit().limit(ip);

      if (!success) {
        const res = new NextResponse("Too many requests", {
          status: 429,
        });

        res.headers.set("X-RateLimit-Limit", String(limit));

        res.headers.set("X-RateLimit-Remaining", String(remaining));

        res.headers.set("X-RateLimit-Reset", String(reset));

        return res;
      }
    } catch (err) {
      /*
       * Fail open if Upstash is temporarily unavailable.
       *
       * This prevents authentication endpoints from becoming
       * completely inaccessible because Redis is down.
       */
      console.error("[middleware] Rate limiter failed:", err);
    }
  }

  /* =======================================================
     BOT PROTECTION
     ======================================================= */

  if (!isApi && isBadBot(req)) {
    return new NextResponse("Forbidden", {
      status: 403,
    });
  }

  /* =======================================================
     INITIAL RESPONSE
     ======================================================= */

  // Supabase may replace this response if it refreshes cookies.
  let response = applySecurityHeaders(
    NextResponse.next({
      request: req,
    }),
  );

  let user = null;

  /* =======================================================
     SUPABASE CONFIG
     ======================================================= */

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /* =======================================================
     IMAGE PROXY
     ======================================================= */

  // Image proxy doesn't need Supabase authentication.
  const isImageProxy = pathname.startsWith("/api/image-proxy");

  /* =======================================================
     SUPABASE SESSION REFRESH
     ======================================================= */

  if (supabaseUrl && supabaseKey && !isImageProxy) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              req.cookies.set(name, value);
            });

            response = applySecurityHeaders(
              NextResponse.next({
                request: req,
              }),
            );

            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      /* =====================================================
         SUPABASE TIMEOUT
         ===================================================== */

      const SUPABASE_TIMEOUT_MS = 5000;

      let timeoutId: ReturnType<typeof setTimeout>;

      const result = await Promise.race([
        supabase.auth.getUser().then((r) => {
          clearTimeout(timeoutId);

          return {
            user: r.data.user,
          };
        }),

        new Promise<{ user: null }>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn("[middleware] supabase.auth.getUser() timed out");

            resolve({
              user: null,
            });
          }, SUPABASE_TIMEOUT_MS);
        }),
      ]);

      user = result.user;
    } catch (err) {
      console.warn("[middleware] Supabase auth failed:", err);
    }
  }

  /* =======================================================
     API / RSC REQUESTS
     ======================================================= */

  if (isApi || isRSC) {
    return response;
  }

  /* =======================================================
     SECOND BOT CHECK
     ======================================================= */

  if (isBadBot(req)) {
    return new NextResponse("Forbidden", {
      status: 403,
    });
  }

  /* =======================================================
     PROTECTED USER LIBRARY
     ======================================================= */

  if (pathname.startsWith("/user/library") && !user) {
    const loginUrl = new URL("/user/profile", req.url);

    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  /* =======================================================
     FINAL RESPONSE
     ======================================================= */

  return response;
}

/* =========================================================
   NEXT.JS MIDDLEWARE MATCHER
   ========================================================= */

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
