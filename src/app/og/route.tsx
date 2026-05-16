import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const W = 1200;
const H = 630;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://watchedthis.com";

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

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

  const composites: sharp.OverlayOptions[] = [];

  // ── Logo ──────────────────────────────────────────────────────────────────

  if (logoBuffer) {
    try {
      const logoImg = await sharp(logoBuffer)
        .resize(150, 50, {
          fit: "contain",
          background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0,
          },
        })
        .png()
        .toBuffer();

      composites.push({
        input: logoImg,
        top: 45,
        left: 60,
      });
    } catch (err) {
      console.error("Logo processing error:", err);
    }
  }

  // ── Poster ────────────────────────────────────────────────────────────────

  if (posterBuffer) {
    try {
      const SLOT_W = 360;
      const SLOT_H = 560;

      const posterImg = await sharp(posterBuffer)
        .resize(SLOT_W, SLOT_H, {
          fit: "contain",
          position: "centre",
          background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0,
          },
        })
        .png()
        .toBuffer();

      const meta = await sharp(posterImg).metadata();

      const posterW = meta.width || SLOT_W;

      const posterH = meta.height || SLOT_H;

      // centered inside right-side area
      const SLOT_X = W - SLOT_W - 60;

      const left = SLOT_X + Math.round((SLOT_W - posterW) / 2);

      const top = Math.round((H - posterH) / 2);

      composites.push({
        input: posterImg,
        top,
        left,
      });
    } catch (err) {
      console.error("Poster processing error:", err);
    }
  }

  // ── Text ──────────────────────────────────────────────────────────────────

  const titleLines = wrapText(title, 26);

  const subtitleLines = wrapText(subtitle, 42);

  const titleY = 170;

  const titleLineHeight = 62;

  const subtitleY = titleY + titleLines.length * titleLineHeight + 28;

  const subtitleLineHeight = 38;

  let svgHtml = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">

  <defs>

    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071821"/>
      <stop offset="100%" stop-color="#0f3441"/>
    </linearGradient>

    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#468189"/>
      <stop offset="100%" stop-color="#7da3ab"/>
    </linearGradient>

  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>

  <rect width="${W}" height="5" fill="url(#accent)"/>

`;

  // title
  titleLines.forEach((line, i) => {
    svgHtml += `
<text
  x="60"
  y="${titleY + i * titleLineHeight}"
  font-size="56"
  font-weight="700"
  fill="#ffffff"
  font-family="Arial, Helvetica, sans-serif"
  letter-spacing="-1"
>
  ${line}
</text>
`;
  });

  // subtitle
  subtitleLines.forEach((line, i) => {
    svgHtml += `
<text
  x="60"
  y="${subtitleY + i * subtitleLineHeight}"
  font-size="28"
  font-weight="400"
  fill="#a8c5cc"
  font-family="Arial, Helvetica, sans-serif"
>
  ${line}
</text>
`;
  });

  // footer
  svgHtml += `
<text
  x="60"
  y="${H - 30}"
  font-size="14"
  fill="#6a8a92"
  font-family="Arial, Helvetica, sans-serif"
>
  watchedthis.com
</text>
`;

  svgHtml += `</svg>`;

  // ── Final render ──────────────────────────────────────────────────────────

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
}
