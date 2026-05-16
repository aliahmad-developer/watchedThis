import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

const W = 1200;
const H = 630;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://watchedthis.com";

const imageCache = new Map<string, ArrayBuffer>();

async function fetchBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    if (imageCache.has(url)) return imageCache.get(url)!;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    imageCache.set(url, buffer);
    return buffer;
  } catch {
    return null;
  }
}

function proxyUrl(size: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const tmdb = `https://image.tmdb.org/t/p/${size}${cleanPath}`;
  // Must be absolute — ImageResponse cannot resolve relative URLs
  return `${APP_URL}/api/image-proxy/?url=${encodeURIComponent(tmdb)}`;
}

function clampText(text: string, max: number) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const title = clampText(
    searchParams.get("title") || "Find Your Next Favorite Watch.",
    90,
  );
  const subtitle = clampText(
    searchParams.get("subtitle") || "Movies & TV shows, curated just for you.",
    140,
  );
  const poster = searchParams.get("poster");
  const logo = searchParams.get("logo");
  const cta = searchParams.get("cta") || "Discover Now →";

  const [posterBuffer, logoBuffer] = await Promise.all([
    poster ? fetchBuffer(proxyUrl("w780", poster)) : Promise.resolve(null),
    logo ? fetchBuffer(proxyUrl("w185", logo)) : Promise.resolve(null),
  ]);

  const hasPoster = Boolean(posterBuffer);
  const hasLogo = Boolean(logoBuffer);

  return new ImageResponse(
    <div
      style={{
        width: `${W}px`,
        height: `${H}px`,
        display: "flex",
        position: "relative",
        flexDirection: "row",
        overflow: "hidden",
        background: "radial-gradient(circle at 20% 20%, #0f3a45, #031926 70%)",
      }}
    >
      {/* Top Accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "4px",
          background: "linear-gradient(to right, #468189, #9dbebb)",
        }}
      />

      {/* Poster */}
      {hasPoster && posterBuffer && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "420px",
            height: "630px",
            display: "flex",
          }}
        >
          <img
            // @ts-expect-error Edge ImageResponse accepts ArrayBuffer
            src={posterBuffer}
            width={420}
            height={630}
            style={{ width: "420px", height: "630px", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to left, rgba(3,25,38,0.95), rgba(3,25,38,0.2))",
            }}
          />
        </div>
      )}

      {/* Left Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: "76px",
          paddingRight: hasPoster ? "460px" : "56px",
          flex: 1,
          zIndex: 2,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "28px",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#468189",
              borderRadius: "6px",
            }}
          />
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>
            Watched<span style={{ color: "#468189" }}>This</span>
          </div>
        </div>

        {/* Logo badge */}
        {hasLogo && logoBuffer && (
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "10px",
              background: "#0d2535",
              marginBottom: "18px",
              display: "flex",
              overflow: "hidden",
            }}
          >
            <img
              // @ts-expect-error
              src={logoBuffer}
              style={{ width: "64px", height: "64px", objectFit: "contain" }}
            />
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: hasPoster ? "36px" : "44px",
            fontWeight: 700,
            color: "#eef0f2",
            lineHeight: 1.15,
            marginBottom: "12px",
            maxWidth: "520px",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "16px",
            color: "#8693ab",
            lineHeight: 1.5,
            maxWidth: "460px",
            marginBottom: "26px",
          }}
        >
          {subtitle}
        </div>

        {/* CTA */}
        <div
          style={{
            width: "180px",
            height: "42px",
            background: "#468189",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {cta}
        </div>
      </div>

      {/* Fallback cards */}
      {!hasPoster && !hasLogo && (
        <div
          style={{
            position: "absolute",
            right: "40px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "300px",
          }}
        >
          {[140, 100, 80].map((h, i) => (
            <div
              key={i}
              style={{
                width: "280px",
                height: `${h}px`,
                background: "#0d2535",
                borderRadius: "8px",
                opacity: 1 - i * 0.15,
              }}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "76px",
          fontSize: "11px",
          color: "#637074",
        }}
      >
        watchedthis.com
      </div>
    </div>,
    {
      width: W,
      height: H,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
      },
    },
  );
}
