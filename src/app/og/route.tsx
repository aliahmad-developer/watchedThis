import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const W = 1200;
const H = 630;

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

  // ---- Logo (top left) ----
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

  // ---- Centered Poster ----
  let posterTop = 0;
  let posterLeft = 0;
  if (posterBuffer) {
    try {
      // Max poster size: 400px wide, 560px tall (leaves room for text below)
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

      // Center horizontally and vertically (with a slight upward offset to leave room for text below)
      posterLeft = Math.round((W - posterW) / 2);
      posterTop = Math.round((H - posterH) / 2) - 40; // shift up a bit so text fits below

      composites.push({ input: posterImg, top: posterTop, left: posterLeft });
    } catch (err) {
      console.error("Poster error:", err);
    }
  }

  // ---- Text (placed below the poster) ----
  const titleLines = wrapText(title, 35);
  const subtitleLines = wrapText(subtitle, 55);

  // Position text below poster (add padding)
  const textStartY = posterTop + 560 + 30; // poster bottom + margin
  const titleLineHeight = 48;
  const subtitleLineHeight = 34;

  let svgHtml = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a0c10"/>
      <stop offset="100%" stop-color="#1a1f2a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="4" fill="#e50914"/> <!-- accent bar -->
`;

  // Title (centered)
  titleLines.forEach((line, i) => {
    svgHtml += `
<text
  x="50%"
  y="${textStartY + i * titleLineHeight}"
  text-anchor="middle"
  font-size="42"
  font-weight="700"
  fill="#ffffff"
  font-family="Arial, Helvetica, sans-serif"
>
  ${line}
</text>
`;
  });

  // Subtitle (centered)
  subtitleLines.forEach((line, i) => {
    svgHtml += `
<text
  x="50%"
  y="${textStartY + titleLines.length * titleLineHeight + 20 + i * subtitleLineHeight}"
  text-anchor="middle"
  font-size="22"
  font-weight="400"
  fill="#b0b8c5"
  font-family="Arial, Helvetica, sans-serif"
>
  ${line}
</text>
`;
  });

  // Footer (bottom right)
  svgHtml += `
<text
  x="${W - 30}"
  y="${H - 25}"
  text-anchor="end"
  font-size="14"
  fill="#6a7a8a"
  font-family="Arial, Helvetica, sans-serif"
>
  watchedthis.com
</text>
`;

  svgHtml += `</svg>`;

  // ---- Render PNG ----
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
