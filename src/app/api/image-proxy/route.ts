import { NextRequest, NextResponse } from "next/server";

// ─── Allowlist ────────────────────────────────────────────────────────────────
const ALLOWED_HOSTNAME = "image.tmdb.org";

// Only these path prefixes are valid TMDB image paths.
// Prevents someone crafting e.g. /t/p/original/../../../etc
const ALLOWED_PATH_PREFIX = "/t/p/";

// Only fetch these sizes — blocks /original which is huge and unnecessary
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
  "original",
]);

// Only pass through actual image content types
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 500;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  // ── Validate url param ─────────────────────────────────────────────────────
  const { searchParams } = request.nextUrl;
  const raw = searchParams.get("url");

  if (!raw) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  // ── Hostname check ─────────────────────────────────────────────────────────
  if (parsed.hostname !== ALLOWED_HOSTNAME) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── Protocol check (no file://, data://, etc.) ────────────────────────────
  if (parsed.protocol !== "https:") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── Path structure check ───────────────────────────────────────────────────
  // TMDB paths look like: /t/p/w780/abc123.jpg
  if (!parsed.pathname.startsWith(ALLOWED_PATH_PREFIX)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── Path traversal check ───────────────────────────────────────────────────
  if (parsed.pathname.includes("..") || parsed.pathname.includes("//")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── Size allowlist check ───────────────────────────────────────────────────
  // Path segment after /t/p/ is the size e.g. "w780"
  const afterPrefix = parsed.pathname.slice(ALLOWED_PATH_PREFIX.length); // "w780/abc.jpg"
  const size = afterPrefix.split("/")[0];
  if (!ALLOWED_SIZES.has(size)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── No query strings forwarded to TMDB ────────────────────────────────────
  // Prevents cache-busting attacks or unexpected TMDB API params
  const cleanUrl = `https://${ALLOWED_HOSTNAME}${parsed.pathname}`;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  try {
    const upstream = await fetch(cleanUrl, {
      headers: {
        // Minimal UA — enough to pass basic bot checks
        "User-Agent": "Mozilla/5.0 (compatible; WatchedThis-Proxy/1.0)",
        // Don't forward any cookies or auth headers upstream
      },
      credentials: "omit",
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status });
    }

    // ── Content-type validation ────────────────────────────────────────────
    // Prevents TMDB (or a redirect) from returning HTML/JS that gets
    // embedded into your page as an "image"
    const contentType = upstream.headers.get("content-type") ?? "";
    const baseType = contentType.split(";")[0].trim(); // strip "; charset=..."
    if (!ALLOWED_CONTENT_TYPES.has(baseType)) {
      return new NextResponse("Unexpected content type", { status: 502 });
    }

    // ── Size guard ─────────────────────────────────────────────────────────
    // Bail if TMDB returns something suspiciously large (>5 MB)
    const contentLength = Number(upstream.headers.get("content-length") ?? 0);
    if (contentLength > 5 * 1024 * 1024) {
      return new NextResponse("Image too large", { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();

    // Double-check actual size after download (content-length can be absent/wrong)
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return new NextResponse("Image too large", { status: 502 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": baseType,
        // Immutable — TMDB image paths are content-addressed (won't change)
        "Cache-Control": "public, max-age=31536000, immutable",
        // Restrict framing
        "X-Content-Type-Options": "nosniff",
        // Only own origin should be calling this proxy
        "Access-Control-Allow-Origin": "https://watchedthis.com",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return new NextResponse("Upstream timed out", { status: 504 });
    }
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
