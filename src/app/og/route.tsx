import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const W = 1200;
const H = 630;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://watchedthis.com";

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
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
      ? fetchBuffer(`https://image.tmdb.org/t/p/w500${poster}`)
      : Promise.resolve(null),
    fetchBuffer(`${APP_URL}/watchedthis-logo.png`),
  ]);

  const composites: sharp.OverlayOptions[] = [];

  if (logoBuffer) {
    try {
      const logoImg = await sharp(logoBuffer, { density: 300 })
        .resize(120, 40, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      composites.push({
        input: logoImg,
        top: 50,
        left: 60,
      });
    } catch (err) {
      console.error("Logo processing error:", err);
    }
  }

  if (posterBuffer) {
    try {
      const posterImg = await sharp(posterBuffer)
        .resize(450, 630, {
          fit: "cover",
          position: "center",
        })
        .toBuffer();

      composites.push({
        input: posterImg,
        top: 0,
        left: 750,
      });
    } catch (err) {
      console.error("Poster processing error:", err);
    }
  }

  const titleLines = wrapText(title, 28);
  const subtitleLines = wrapText(subtitle, 45);

  const titleY = 150;
  const titleLineHeight = 70;
  const subtitleY = titleY + titleLines.length * titleLineHeight + 40;
  const subtitleLineHeight = 40;

  let svgHtml = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a1f2e"/>
        <stop offset="100%" stop-color="#1a3a45"/>
      </linearGradient>
      <linearGradient id="fadeRight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="50%" stop-color="#0a1f2e" stop-opacity="1"/>
        <stop offset="100%" stop-color="#0a1f2e" stop-opacity="0"/>
      </linearGradient>
    </defs>
    
    <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
    <rect width="6" height="${H}" fill="#468189"/>
    
    <!-- Fade for poster area -->
    <rect x="600" y="0" width="600" height="${H}" fill="url(#fadeRight)"/>
    `;

  titleLines.forEach((line, i) => {
    svgHtml += `<text x="60" y="${
      titleY + i * titleLineHeight
    }" font-size="60" font-weight="700" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">${line}</text>`;
  });

  subtitleLines.forEach((line, i) => {
    svgHtml += `<text x="60" y="${
      subtitleY + i * subtitleLineHeight
    }" font-size="30" font-weight="400" fill="#a8c5cc" font-family="system-ui, -apple-system, sans-serif">${line}</text>`;
  });

  svgHtml += `<text x="60" y="${
    H - 30
  }" font-size="14" fill="#6a8a92" font-family="system-ui, -apple-system, sans-serif">watchedthis.com</text>`;
  svgHtml += `</svg>`;

  const png = await sharp(Buffer.from(svgHtml))
    .composite(composites)
    .png()
    .toBuffer();

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
