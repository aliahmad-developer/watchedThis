import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const W = 1200; 
const H = 630;

const COLORS = {
  bg: "#031926", // --color-dark-bg
  card: "#0d2535", // --color-dark-card (used for subtle gradient end)
  accent: "#468189", // --color-dark-accent (top bar)
  title: "#eef0f2", // --color-dark-header
  subtitle: "#bdd4e7", // --color-dark-body-text
  footer: "#8693ab", // --color-dark-secondary-text
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

  const composites: sharp.OverlayOptions[] = [];

  // Logo (top left)
  if (logoBuffer) {
    try {
      const logoImg = await sharp(logoBuffer)
        .resize(150, 50, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({ input: logoImg, top: 30, left: 30 });
    } catch (err) {
      console.error("Logo error:", err);
    }
  }

  // Centered poster
  let posterTop = 0;
  let posterLeft = 0;
  if (posterBuffer) {
    try {
      const MAX_POSTER_W = 400;
      const MAX_POSTER_H = 560;

      let posterImg = await sharp(posterBuffer)
        .resize(MAX_POSTER_W, MAX_POSTER_H, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      const meta = await sharp(posterImg).metadata();
      const posterW = meta.width || MAX_POSTER_W;
      const posterH = meta.height || MAX_POSTER_H;

      posterLeft = Math.round((W - posterW) / 2);
      posterTop = Math.round((H - posterH) / 2) - 40; // shift up for text below

      composites.push({ input: posterImg, top: posterTop, left: posterLeft });
    } catch (err) {
      console.error("Poster error:", err);
    }
  }

  // Text below poster
  const titleLines = wrapText(title, 35);
  const subtitleLines = wrapText(subtitle, 55);
  const textStartY = posterTop + 560 + 30;
  const titleLineHeight = 48;
  const subtitleLineHeight = 34;

  let svgHtml = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.bg}"/>
      <stop offset="100%" stop-color="${COLORS.card}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="4" fill="${COLORS.accent}"/>
`;

  // Title
  titleLines.forEach((line, i) => {
    svgHtml += `
<text
  x="50%"
  y="${textStartY + i * titleLineHeight}"
  text-anchor="middle"
  font-size="42"
  font-weight="700"
  fill="${COLORS.title}"
  font-family="Arial, Helvetica, sans-serif"
>
  ${line}
</text>
`;
  });

  // Subtitle
  subtitleLines.forEach((line, i) => {
    svgHtml += `
<text
  x="50%"
  y="${textStartY + titleLines.length * titleLineHeight + 20 + i * subtitleLineHeight}"
  text-anchor="middle"
  font-size="22"
  font-weight="400"
  fill="${COLORS.subtitle}"
  font-family="Arial, Helvetica, sans-serif"
>
  ${line}
</text>
`;
  });

  // Footer
  svgHtml += `
<text
  x="${W - 30}"
  y="${H - 25}"
  text-anchor="end"
  font-size="14"
  fill="${COLORS.footer}"
  font-family="Arial, Helvetica, sans-serif"
>
  watchedthis.com
</text>
`;

  svgHtml += `</svg>`;

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
