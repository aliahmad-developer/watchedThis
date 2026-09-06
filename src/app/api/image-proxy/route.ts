import { NextRequest, NextResponse } from "next/server";
// ─── Allowlist ────────────────────────────────────────────────────────────────
const ALLOWED_HOSTNAME = "image.tmdb.org";
const ALLOWED_PATH_PREFIX = "/t/p/";

const ALLOWED_SIZES = new Set([
  "w92",
  "w154",
  "w185",
  "w342",
  "w500",
  "w780",
  "w1280",
  "h632",
  "w300",
]);

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS =
  process.env.NODE_ENV === "production"
    ? ["https://watchedthis.com"]
    : ["https://watchedthis.com", "http://localhost:3000"];

function getCorsOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return ALLOWED_ORIGINS[0];
  }

  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

const RATE_LIMIT = 500;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_WINDOW_MS,
    });

    return false;
  }

  if (entry.count >= RATE_LIMIT) {
    return true;
  }

  entry.count++;

  return false;
}

// ─── OPTIONS (CORS preflight) ────────────────────────────────────────────────
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": getCorsOrigin(request),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: {
        "Access-Control-Allow-Origin": getCorsOrigin(request),
      },
    });
  }

  const { searchParams } = request.nextUrl;
  const raw = searchParams.get("url");

  if (!raw) {
    return new NextResponse("Missing url param", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": getCorsOrigin(request),
      },
    });
  }

  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": getCorsOrigin(request),
      },
    });
  }

  // Security validation
  if (parsed.protocol !== "https:") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (parsed.hostname !== ALLOWED_HOSTNAME) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!parsed.pathname.startsWith(ALLOWED_PATH_PREFIX)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (parsed.pathname.includes("..") || parsed.pathname.includes("//")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const afterPrefix = parsed.pathname.slice(ALLOWED_PATH_PREFIX.length);
  const size = afterPrefix.split("/")[0];

  if (!ALLOWED_SIZES.has(size)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const cleanUrl = `https://${ALLOWED_HOSTNAME}${parsed.pathname}`;

  try {
    const upstream = await fetch(cleanUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WatchedThis-Proxy/1.0)",
      },
    });

    if (!upstream.ok) {
      return new NextResponse("Upstream error", {
        status: upstream.status,
        headers: {
          "Access-Control-Allow-Origin": getCorsOrigin(request),
        },
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    const baseType = contentType.split(";")[0].trim().toLowerCase();

    if (!ALLOWED_CONTENT_TYPES.has(baseType)) {
      return new NextResponse("Unexpected content type", {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": getCorsOrigin(request),
        },
      });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": baseType,

        "Cache-Control": "public, max-age=31536000, immutable",

        "X-Content-Type-Options": "nosniff",

        "Access-Control-Allow-Origin": getCorsOrigin(request),

        Vary: "Origin",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.name : "";

    if (message === "TimeoutError" || message === "AbortError") {
      return new NextResponse("Upstream timed out", {
        status: 504,
        headers: {
          "Access-Control-Allow-Origin": getCorsOrigin(request),
        },
      });
    }

    console.error("Image proxy error:", error);

    return new NextResponse("Failed to fetch image", {
      status: 502,
      headers: {
        "Access-Control-Allow-Origin": getCorsOrigin(request),
      },
    });
  }
}
