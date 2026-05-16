import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const W = 1200;
const H = 630;

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

  const composites: sharp.OverlayOptions[] = [];

  // Logo (top left, but above poster area)
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

  // Poster (left-aligned, no gaps around it)
  let posterHeight = 0;
  if (posterBuffer) {
    try {
      const POSTER_WIDTH = 360; // fixed width
      const MAX_POSTER_HEIGHT = 560; // fit within canvas (630 - margins)

      let posterImg = await sharp(posterBuffer)
        .resize(POSTER_WIDTH, MAX_POSTER_HEIGHT, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      const meta = await sharp(posterImg).metadata();
      const actualWidth = meta.width || POSTER_WIDTH;
      const actualHeight = meta.height || MAX_POSTER_HEIGHT;
      posterHeight = actualHeight;

      // Left margin: 40px, vertically centered (or slightly offset)
      const left = 40;
      const top = Math.round((H - actualHeight) / 2);

      composites.push({ input: posterImg, top, left });
    } catch (err) {
      console.error("Poster error:", err);
    }
  }

  // Text area (right side, starting after poster + margin)
  const textStartX = 440; // 40 (poster left) + 360 (poster width) + 40 (gap)
  const textMaxWidth = W - textStartX - 40; // ~720px

  // Wrap text to fit the right column (more characters because wider)
  const titleLines = wrapText(title, 45);
  const subtitleLines = wrapText(subtitle, 85);

  // Vertical start: align with poster's vertical center
  const titleStartY = Math.max(
    140,
    (H - (titleLines.length * 48 + subtitleLines.length * 34 + 40)) / 2,
  );
  const titleLineHeight = 52;
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

  // Title (right side)
  titleLines.forEach((line, i) => {
    svgHtml += `
<text
  x="${textStartX}"
  y="${titleStartY + i * titleLineHeight}"
  font-size="44"
  font-weight="700"
  fill="${COLORS.title}"
  font-family="Arial, Helvetica, sans-serif"
>
  ${line}
</text>
`;
  });

  // Subtitle (right side)
  const subtitleStartY = titleStartY + titleLines.length * titleLineHeight + 20;
  subtitleLines.forEach((line, i) => {
    svgHtml += `
<text
  x="${textStartX}"
  y="${subtitleStartY + i * subtitleLineHeight}"
  font-size="24"
  font-weight="400"
  fill="${COLORS.subtitle}"
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
