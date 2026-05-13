import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const W = 1200;
const H = 630;

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Must be an absolute URL so Edge runtime can fetch it.
// Set NEXT_PUBLIC_APP_URL in your .env:
//   NEXT_PUBLIC_APP_URL=https://watchedthis.com   (production)
//   NEXT_PUBLIC_APP_URL=http://localhost:3000      (local dev)
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

// ─── Build a proxy URL for a TMDB image path ─────────────────────────────────
// e.g. tmdbProxyUrl('w780', '/abc123.jpg')
//   → https://watchedthis.com/api/image-proxy?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Fw780%2Fabc123.jpg
function tmdbProxyUrl(size: string, path: string): string {
  const tmdbUrl = `https://image.tmdb.org/t/p/${size}${path}`;
  return `${APP_URL}/api/image-proxy?url=${encodeURIComponent(tmdbUrl)}`;
}

// ─── Fetch image through our proxy → ArrayBuffer ──────────────────────────────
// Passing ArrayBuffer (not a URL string) is the only reliable way to render
// external images inside next/og on the Edge runtime.
async function fetchBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // All params are optional — falls back to a clean default card
  const title = searchParams.get("title") || "Find Your Next Favorite Watch.";
  const subtitle =
    searchParams.get("subtitle") || "Movies & TV shows, curated just for you.";
  const poster = searchParams.get("poster"); // TMDB path e.g. /abc123.jpg
  const logo = searchParams.get("logo"); // TMDB path e.g. /xyz.png

  // ── Fetch both images concurrently through the proxy ────────────────────────
  const [posterBuffer, logoBuffer] = await Promise.all([
    poster ? fetchBuffer(tmdbProxyUrl("w780", poster)) : Promise.resolve(null),
    logo ? fetchBuffer(tmdbProxyUrl("w185", logo)) : Promise.resolve(null),
  ]);

  const hasPoster = Boolean(posterBuffer);
  const hasLogo = Boolean(logoBuffer);

  return new ImageResponse(
    <div
      style={{
        width: `${W}px`,
        height: `${H}px`,
        background: "#031926",
        display: "flex",
        flexDirection: "row",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Top accent bar ──────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1200px",
          height: "4px",
          background: "linear-gradient(to right, #468189, #9dbebb)",
          display: "flex",
        }}
      />

      {/* ── Left accent line ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "52px",
          left: "52px",
          width: "2px",
          height: "526px",
          background: "rgba(70,129,137,0.3)",
          display: "flex",
        }}
      />

      {/* ── POSTER — right side, full bleed ─────────────────────────────── */}
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
            // @ts-expect-error — next/og accepts ArrayBuffer here, types say string
            src={posterBuffer}
            width={420}
            height={630}
            style={{
              width: "420px",
              height: "630px",
              objectFit: "cover",
              objectPosition: "center top",
            }}
          />
          {/* Horizontal fade — keeps left text readable over the poster */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(to right, #031926 0%, rgba(3,25,38,0.9) 25%, rgba(3,25,38,0.4) 60%, rgba(3,25,38,0.05) 100%)",
              display: "flex",
            }}
          />
          {/* Bottom vignette */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "80px",
              background:
                "linear-gradient(to top, rgba(3,25,38,0.65) 0%, transparent 100%)",
              display: "flex",
            }}
          />
        </div>
      )}

      {/* ── LEFT CONTENT ────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: "76px",
          paddingRight: hasPoster ? "450px" : "56px",
          flex: 1,
          zIndex: 2,
        }}
      >
        {/* ── WatchedThis brand lockup ───────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          {/* Icon — mirrors watchedthis-logo.svg */}
          <div
            style={{
              width: "38px",
              height: "36px",
              background: "#2a7f8a",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "34px",
                height: "32px",
                background: "#0f1e30",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "27px",
                  height: "22px",
                  background: "#e8e0d0",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "21px",
                    height: "15px",
                    background: "#0f1e30",
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    paddingLeft: "2px",
                    paddingRight: "2px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "5px",
                      background: "#3a9aa8",
                      borderRadius: "1px",
                      display: "flex",
                    }}
                  />
                  <div
                    style={{
                      width: "6px",
                      height: "5px",
                      background: "#3a9aa8",
                      borderRadius: "1px",
                      display: "flex",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: "18px",
                color: "#ffffff",
                fontWeight: 700,
                letterSpacing: "-0.3px",
              }}
            >
              Watched
            </span>
            <span
              style={{
                fontSize: "18px",
                color: "#468189",
                fontWeight: 700,
                letterSpacing: "-0.3px",
              }}
            >
              This
            </span>
          </div>
        </div>

        {/* ── Show/movie logo badge ──────────────────────────────────────── */}
        {hasLogo && logoBuffer && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "68px",
              height: "68px",
              background: "#0d2535",
              borderRadius: "10px",
              border: "1px solid #1a3a4a",
              marginBottom: "20px",
              overflow: "hidden",
            }}
          >
            <img
              // @ts-expect-error — next/og accepts ArrayBuffer here, types say string
              src={logoBuffer}
              style={{
                maxWidth: "54px",
                maxHeight: "54px",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <div
          style={{
            fontSize: hasPoster || hasLogo ? "36px" : "46px",
            color: "#eef0f2",
            lineHeight: 1.15,
            letterSpacing: "-0.5px",
            marginBottom: "12px",
            display: "flex",
            flexWrap: "wrap",
            maxWidth: "530px",
            fontWeight: 700,
          }}
        >
          {title}
        </div>

        {/* ── Subtitle ──────────────────────────────────────────────────── */}
        <div
          style={{
            fontSize: "16px",
            color: "#8693ab",
            marginBottom: "28px",
            display: "flex",
            maxWidth: "460px",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>

        {/* ── CTA pill ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "178px",
            height: "40px",
            background: "#468189",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Discover Now →
        </div>
      </div>

      {/* ── Mock cards — shown only when there's no poster or logo ───────── */}
      {!hasPoster && !hasLogo && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: "12px",
            paddingRight: "52px",
            width: "320px",
            zIndex: 2,
          }}
        >
          {[
            { h: 140, pw: 86 },
            { h: 100, pw: 70 },
            { h: 82, pw: 58 },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: "270px",
                height: `${card.h}px`,
                background: "#0d2535",
                borderRadius: "8px",
                border: "1px solid #1a3a4a",
                overflow: "hidden",
                opacity: 1 - i * 0.12,
              }}
            >
              <div
                style={{
                  width: `${card.pw}px`,
                  height: `${card.h}px`,
                  background: "#1a3a4a",
                  display: "flex",
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "11px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: "130px",
                    height: "7px",
                    background: "#2a4a5a",
                    borderRadius: "3px",
                    marginBottom: "7px",
                    display: "flex",
                  }}
                />
                <div
                  style={{
                    width: "95px",
                    height: "7px",
                    background: "#2a4a5a",
                    borderRadius: "3px",
                    marginBottom: "7px",
                    display: "flex",
                  }}
                />
                <div
                  style={{
                    width: "65px",
                    height: "6px",
                    background: "#1a3a4a",
                    borderRadius: "3px",
                    marginBottom: "9px",
                    display: "flex",
                  }}
                />
                <div
                  style={{
                    fontSize: "10px",
                    color: "#468189",
                    display: "flex",
                  }}
                >
                  {i === 0 ? "★★★★★" : "★★★★☆"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Domain watermark ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "22px",
          left: "76px",
          fontSize: "11px",
          color: "#637074",
          letterSpacing: "1.5px",
          display: "flex",
        }}
      >
        watchedthis.com
      </div>

      {/* ── Bottom accent ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "1200px",
          height: "3px",
          background: "rgba(70,129,137,0.3)",
          display: "flex",
        }}
      />
    </div>,
    {
      width: W,
      height: H,
      headers: {
        "Content-Type": "image/png",
        // 10 min fresh, 1 hr stale — bump to max-age=86400 once confirmed working
        "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
      },
    },
  );
}
