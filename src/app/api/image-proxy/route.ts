import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

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

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 500;
const RATE_WINDOW_MS = 60_000;
const CLEANUP_INTERVAL_MS = 5 * 60_000;

function pruneRateLimitMap() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}
setInterval(pruneRateLimitMap, CLEANUP_INTERVAL_MS);

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
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return new NextResponse("Too many requests", { status: 429 });
  }

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

  if (parsed.hostname !== ALLOWED_HOSTNAME) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (parsed.protocol !== "https:") {
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
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WatchedThis-Proxy/1.0)",
      },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    const baseType = contentType.split(";")[0].trim();

    if (!ALLOWED_CONTENT_TYPES.has(baseType)) {
      return new NextResponse("Unexpected content type", { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();

    if (buffer.byteLength > 5 * 1024 * 1024) {
      return new NextResponse("Image too large", { status: 502 });
    }

    // ─── WebP conversion ──────────────────────────────────────────────────────
    const acceptsWebP = request.headers.get("accept")?.includes("image/webp");
    const isSVG = baseType === "image/svg+xml";

    let responseBuffer: ArrayBuffer;
    let responseContentType: string;

    if (acceptsWebP && !isSVG) {
      const webpBuffer = await sharp(Buffer.from(buffer))
        .webp({ quality: 82 }) // ~30–50% smaller than JPEG at same visual quality
        .toBuffer();

      responseBuffer = webpBuffer.buffer.slice(
        webpBuffer.byteOffset,
        webpBuffer.byteOffset + webpBuffer.byteLength,
      ) as ArrayBuffer;
      responseContentType = "image/webp";
    } else {
      responseBuffer = buffer;
      responseContentType = baseType;
    }
    // ─────────────────────────────────────────────────────────────────────────

    return new NextResponse(responseBuffer, {
      status: 200,
      headers: {
        "Content-Type": responseContentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "https://watchedthis.com",
        // Accept added so CDN caches WebP and JPEG as separate entries
        Vary: "Origin, Accept",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return new NextResponse("Upstream timed out", { status: 504 });
    }
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
