import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const W = 1200;
const H = 630;
const FONT = "DejaVu Sans, sans-serif";

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

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = esc(searchParams.get("title") || "WatchedThis");
  const subtitle = esc(
    searchParams.get("subtitle") || "Find your next favorite watch",
  );
  const poster = searchParams.get("poster");

  const [posterBuffer, logoBuffer] = await Promise.all([
    poster
      ? fetchBuffer(`https://image.tmdb.org/t/p/w780${poster}`)
      : Promise.resolve(null),
    fetchBuffer(`${APP_URL}/watchedthis-logo.png`),
  ]);

  const hasPoster = !!posterBuffer;

  // Layout constants
  const HEADER_H = 80;
  const POSTER_LEFT = 40;
  const POSTER_WIDTH = 340;
  const POSTER_MAX_H = H - 40;
  const TEXT_START_X = hasPoster ? POSTER_LEFT + POSTER_WIDTH + 40 : 60;
  const titleMaxChars = hasPoster ? 38 : 55;
  const subtitleMaxChars = hasPoster ? 72 : 100;

  const composites: sharp.OverlayOptions[] = [];

  // 1. Poster — composited first (bottom layer)
  if (posterBuffer) {
    try {
      const posterImg = await sharp(posterBuffer)
        .resize(POSTER_WIDTH, POSTER_MAX_H, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      const meta = await sharp(posterImg).metadata();
      const actualH = meta.height || POSTER_MAX_H;
      const top = Math.round((H - actualH) / 2);

      composites.push({ input: posterImg, top, left: POSTER_LEFT });
    } catch (err) {
      console.error("Poster composite error:", err);
    }
  }

  // 2. Logo — only as fallback when no poster, composited last (top layer)
  if (!hasPoster && logoBuffer) {
    try {
      const logoImg = await sharp(logoBuffer)
        .resize(150, 50, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      composites.push({
        input: logoImg,
        top: Math.round((HEADER_H - 50) / 2),
        left: 30,
      });
    } catch (err) {
      console.error("Logo composite error:", err);
    }
  }

  // Text layout
  const titleLines = wrapText(title, titleMaxChars);
  const subtitleLines = wrapText(subtitle, subtitleMaxChars);
  const titleLineH = 52;
  const subtitleLineH = 34;
  const blockH =
    titleLines.length * titleLineH + subtitleLines.length * subtitleLineH + 24;

  const contentAreaTop = hasPoster ? 0 : HEADER_H;
  const contentAreaH = H - contentAreaTop;
  const titleStartY =
    contentAreaTop + Math.round((contentAreaH - blockH) / 2) + titleLineH;
  const subtitleStartY = titleStartY + titleLines.length * titleLineH + 20;

  // Build SVG — all attribute values properly quoted, font has no inner quotes
  let svgHtml = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.bg}"/>
      <stop offset="100%" stop-color="${COLORS.card}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="4" fill="${COLORS.accent}"/>`;

  if (!hasPoster) {
    svgHtml += `
  <rect x="0" y="${HEADER_H}" width="${W}" height="1" fill="${COLORS.accent}" opacity="0.3"/>`;
  }

  titleLines.forEach((line, i) => {
    svgHtml += `
  <text x="${TEXT_START_X}" y="${titleStartY + i * titleLineH}" font-size="44" font-weight="700" fill="${COLORS.title}" font-family="${FONT}">${line}</text>`;
  });

  subtitleLines.forEach((line, i) => {
    svgHtml += `
  <text x="${TEXT_START_X}" y="${subtitleStartY + i * subtitleLineH}" font-size="24" font-weight="400" fill="${COLORS.subtitle}" font-family="${FONT}">${line}</text>`;
  });

  svgHtml += `
  <text x="${W - 30}" y="${H - 20}" text-anchor="end" font-size="14" fill="${COLORS.footer}" font-family="${FONT}">watchedthis.com</text>
</svg>`;

  try {
    const png = await sharp(Buffer.from(svgHtml))
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
    console.error("OG image render error:", err);
    return new NextResponse("Failed to generate image", { status: 500 });
  }
}
