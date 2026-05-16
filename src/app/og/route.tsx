// app/api/og/route.tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const W = 1200;
const H = 630;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://watchedthis.com";

const C = {
  bg: "#031926",
  bgLight: "#0f3a45",
  accent: "#468189",
  accentLight: "#9dbebb",
  textPrimary: "#eef0f2",
  textSecondary: "#7a93a0",
  textMuted: "#3a5560",
  posterBg: "#041e2b",
} as const;

// Satori's font type
type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
};

async function loadFonts(): Promise<SatoriFont[]> {
  // Try local TTF files first
  try {
    const [regular, bold] = await Promise.all([
      readFile(path.join(process.cwd(), "public/fonts/inter-regular.ttf")),
      readFile(path.join(process.cwd(), "public/fonts/inter-bold.ttf")),
    ]);
    return [
      {
        name: "Inter",
        data: regular.buffer as ArrayBuffer,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: bold.buffer as ArrayBuffer,
        weight: 700,
        style: "normal",
      },
    ];
  } catch {
    // Local fonts not found — fetch TTF from Google (NOT woff2, satori needs TTF/OTF)
    try {
      const [r, b] = await Promise.all([
        fetch(
          "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
          { signal: AbortSignal.timeout(5000) },
        ),
        fetch(
          "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff",
          { signal: AbortSignal.timeout(5000) },
        ),
      ]);
      if (r.ok && b.ok) {
        return [
          {
            name: "Inter",
            data: await r.arrayBuffer(),
            weight: 400,
            style: "normal",
          },
          {
            name: "Inter",
            data: await b.arrayBuffer(),
            weight: 700,
            style: "normal",
          },
        ];
      }
    } catch {
      // fall through
    }
  }

  // Return empty — satori falls back to system sans-serif
  return [] as SatoriFont[];
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function tmdbProxy(size: string, p: string): string {
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${APP_URL}/api/image-proxy/?url=${encodeURIComponent(
    `https://image.tmdb.org/t/p/${size}${clean}`,
  )}`;
}

function clamp(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "…" : s;
}

export async function GET(req: NextRequest): Promise<Response> {
  const sp = new URL(req.url).searchParams;

  const rawTitle = sp.get("title") ?? "";
  const rawSubtitle =
    sp.get("subtitle") ?? "Movies & TV shows, curated just for you.";
  const poster = sp.get("poster");
  const logo = sp.get("logo");
  const type = sp.get("type") ?? "default";
  const cta = sp.get("cta") ?? "Discover Now →";

  const title = clamp(rawTitle, 80);
  const subtitle = clamp(rawSubtitle, 130);
  const isPerson = type === "person";
  const isHome = !poster && !rawTitle;
  const effectiveTitle = title || "Find Your Next Favorite Watch.";

  const posterSize = isPerson ? "h632" : "w780";

  const [fonts, posterDataUrl, logoDataUrl, siteLogoDataUrl] =
    await Promise.all([
      loadFonts(),
      poster ? toDataUrl(tmdbProxy(posterSize, poster)) : Promise.resolve(null),
      logo ? toDataUrl(tmdbProxy("w185", logo)) : Promise.resolve(null),
      toDataUrl(`${APP_URL}/watchedthis-logo.svg`),
    ]);

  const accentBar = (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`,
      }}
    />
  );

  const footerEl = (centered: boolean = false) => (
    <div
      style={{
        position: "absolute",
        bottom: 22,
        ...(centered
          ? { left: 0, right: 0, display: "flex", justifyContent: "center" }
          : { left: 60 }),
        color: C.textMuted,
        fontSize: 11,
        fontFamily: "Inter",
      }}
    >
      watchedthis.com
    </div>
  );

  // ── Home / brand page ──────────────────────────────────────────────────────
  if (isHome) {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: W,
          height: H,
          background: `radial-gradient(ellipse at 50% 40%, #0f3f50 0%, ${C.bg} 55%, #020f18 100%)`,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {accentBar}

        {/* Center glow */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 400,
            borderRadius: 250,
            background:
              "radial-gradient(circle, rgba(70,129,137,0.18) 0%, rgba(70,129,137,0) 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-250px, -200px)",
          }}
        />

        {siteLogoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={siteLogoDataUrl}
            width={340}
            height={82}
            alt="WatchedThis"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              color: C.textPrimary,
              fontSize: 52,
              fontWeight: 700,
              fontFamily: "Inter",
            }}
          >
            WatchedThis
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            width: 240,
            height: 1,
            background: C.accent,
            opacity: 0.45,
            marginTop: 22,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            color: C.textSecondary,
            fontSize: 20,
            fontWeight: 400,
            fontFamily: "Inter",
            marginTop: 20,
            letterSpacing: 0.5,
          }}
        >
          {subtitle}
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            marginTop: 26,
            background: C.accent,
            borderRadius: 24,
            paddingLeft: 36,
            paddingRight: 36,
            paddingTop: 13,
            paddingBottom: 13,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "Inter",
            letterSpacing: 1,
          }}
        >
          {cta}
        </div>

        {footerEl(true)}
      </div>,
      { width: W, height: H, fonts },
    );
  }

  // ── Content page (movie / TV / person) ────────────────────────────────────
  const POSTER_W = isPerson ? 420 : 470;
  const TEXT_W = W - POSTER_W + 60;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: W,
        height: H,
        background: `linear-gradient(135deg, ${C.bgLight} 0%, ${C.bg} 65%)`,
        position: "relative",
      }}
    >
      {accentBar}

      {/* ── Poster / photo ── */}
      {posterDataUrl && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: POSTER_W,
            height: H,
            display: "flex",
            overflow: "hidden",
            background: isPerson ? "transparent" : C.posterBg,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterDataUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: isPerson ? "cover" : "contain",
              objectPosition: isPerson ? "top center" : "center",
            }}
          />

          {/* Left-edge fade */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: isPerson ? "55%" : "40%",
              background: `linear-gradient(90deg, ${C.bg}ff 0%, ${C.bg}99 35%, ${C.bg}55 65%, ${C.bg}00 100%)`,
            }}
          />

          {/* Bottom vignette */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
              background: `linear-gradient(180deg, transparent 0%, ${C.bg}88 100%)`,
            }}
          />
        </div>
      )}

      {/* ── Text panel ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 60,
          paddingRight: 32,
          paddingTop: 20,
          paddingBottom: 20,
          width: TEXT_W,
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Site logo */}
        {siteLogoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={siteLogoDataUrl}
            width={155}
            height={37}
            alt="WatchedThis"
            style={{
              objectFit: "contain",
              objectPosition: "left center",
              marginBottom: 20,
            }}
          />
        )}

        {/* Network logo badge */}
        {logoDataUrl && (
          <div
            style={{
              display: "flex",
              marginBottom: 18,
              width: 44,
              height: 44,
              borderRadius: 6,
              overflow: "hidden",
              background: C.posterBg,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDataUrl}
              width={44}
              height={44}
              alt=""
              style={{ objectFit: "contain" }}
            />
          </div>
        )}

        {/* Person label */}
        {isPerson && (
          <div
            style={{
              color: C.accent,
              fontSize: 11,
              fontWeight: 400,
              fontFamily: "Inter",
              letterSpacing: 2.5,
              marginBottom: 10,
            }}
          >
            PERSON
          </div>
        )}

        {/* Title */}
        <div
          style={{
            color: C.textPrimary,
            fontSize: 40,
            fontWeight: 700,
            fontFamily: "Inter",
            lineHeight: 1.2,
            marginBottom: 14,
          }}
        >
          {effectiveTitle}
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: C.textSecondary,
            fontSize: 16,
            fontWeight: 400,
            fontFamily: "Inter",
            lineHeight: 1.65,
          }}
        >
          {subtitle}
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            marginTop: 28,
            background: C.accent,
            borderRadius: 7,
            paddingLeft: 22,
            paddingRight: 22,
            paddingTop: 11,
            paddingBottom: 11,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "Inter",
            alignSelf: "flex-start",
          }}
        >
          {cta}
        </div>
      </div>

      {footerEl()}
    </div>,
    { width: W, height: H, fonts },
  );
}
