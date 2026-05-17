import { NextRequest, NextResponse } from "next/server";
import satori from "satori";
import sharp from "sharp";

const W = 1200;
const H = 630;
const POSTER_LEFT = 40;
const POSTER_WIDTH = 340;
const POSTER_MAX_H = H - 40;

const COLORS = {
  bg: "#031926",
  card: "#0d2535",
  accent: "#468189",
  title: "#eef0f2",
  subtitle: "#bdd4e7",
  footer: "#8693ab",
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://watchedthis.com";

// ─── Font cache (survives warm instances) ─────────────────────────────────────
let _fontRegular: ArrayBuffer | null = null;
let _fontBold: ArrayBuffer | null = null;

async function getFonts(): Promise<{
  regular: ArrayBuffer;
  bold: ArrayBuffer;
}> {
  const [regular, bold] = await Promise.all([
    _fontRegular
      ? Promise.resolve(_fontRegular)
      : fetch(
          "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff",
        )
          .then((r) => r.arrayBuffer())
          .then((ab) => {
            _fontRegular = ab;
            return ab;
          }),
    _fontBold
      ? Promise.resolve(_fontBold)
      : fetch(
          "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff",
        )
          .then((r) => r.arrayBuffer())
          .then((ab) => {
            _fontBold = ab;
            return ab;
          }),
  ]);
  return { regular, bold };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function toBase64Url(buffer: Buffer, mime = "image/png"): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "WatchedThis";
  const subtitle =
    searchParams.get("subtitle") || "Find your next favorite watch";
  const poster = searchParams.get("poster");

  const [posterBuffer, logoBuffer, { regular, bold }] = await Promise.all([
    poster
      ? fetchBuffer(`https://image.tmdb.org/t/p/w780${poster}`)
      : Promise.resolve(null),
    fetchBuffer(`${APP_URL}/watchedthis-logo.png`),
    getFonts(),
  ]);

  const hasPoster = !!posterBuffer;
  const textLeft = hasPoster ? POSTER_LEFT + POSTER_WIDTH + 40 : 60;
  const textWidth = W - textLeft - 60;
  const HEADER_H = 80;

  // Logo as base64 for satori (only in no-poster layout)
  let logoDataUrl: string | null = null;
  if (!hasPoster && logoBuffer) {
    try {
      logoDataUrl = toBase64Url(logoBuffer);
    } catch {}
  }

  // ─── Satori layout ──────────────────────────────────────────────────────────
  const svg = await satori(
    <div
      style={{
        display: "flex",
        width: W,
        height: H,
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.card} 100%)`,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter",
      }}
    >
      {/* Top accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: 4,
          background: COLORS.accent,
        }}
      />

      {/* No-poster: header bar with logo */}
      {!hasPoster && (
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 0,
            width: W,
            height: HEADER_H,
            display: "flex",
            alignItems: "center",
            paddingLeft: 30,
            borderBottomWidth: 1,
            borderBottomStyle: "solid",
            borderBottomColor: `${COLORS.accent}55`,
          }}
        >
          {logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDataUrl}
              width={150}
              height={50}
              alt="WatchedThis"
              style={{ objectFit: "contain" }}
            />
          )}
        </div>
      )}

      {/* Text block */}
      <div
        style={{
          position: "absolute",
          left: textLeft,
          top: !hasPoster ? HEADER_H + 4 : 0,
          width: textWidth,
          height: !hasPoster ? H - HEADER_H - 4 : H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.title,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: COLORS.subtitle,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 30,
          fontSize: 14,
          color: COLORS.footer,
        }}
      >
        watchedthis.com
      </div>
    </div>,
    {
      width: W,
      height: H,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    },
  );

  // ─── Poster composite ────────────────────────────────────────────────────────
  const composites: sharp.OverlayOptions[] = [];

  if (posterBuffer) {
    try {
      const meta = await sharp(posterBuffer).metadata();
      const origW = meta.width || POSTER_WIDTH;
      const origH = meta.height || POSTER_MAX_H;
      const scale = Math.min(POSTER_WIDTH / origW, POSTER_MAX_H / origH);
      const actualW = Math.round(origW * scale);
      const actualH = Math.round(origH * scale);

      const resized = await sharp(posterBuffer)
        .resize(actualW, actualH)
        .png()
        .toBuffer();

      composites.push({
        input: resized,
        top: Math.round((H - actualH) / 2),
        left: POSTER_LEFT + Math.round((POSTER_WIDTH - actualW) / 2),
      });
    } catch (err) {
      console.error("Poster error:", err);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  try {
    const png = await sharp(Buffer.from(svg))
      .composite(composites)
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("OG render error:", err);
    return new NextResponse("Failed to generate image", { status: 500 });
  }
}
