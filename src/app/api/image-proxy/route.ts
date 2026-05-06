import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTNAME = "image.tmdb.org";

export async function GET(request: NextRequest) {
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

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
      credentials: "omit",
      signal: AbortSignal.timeout(8000), // ← only change
    });

    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return new NextResponse("Upstream timed out", { status: 504 });
    }
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
