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

function proxyUrl(size: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const tmdb = `https://image.tmdb.org/t/p/${size}${cleanPath}`;
  return `${APP_URL}/api/image-proxy/?url=${encodeURIComponent(tmdb)}`;
}

function clampText(text: string, max: number) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function esc(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
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

  // ── Fetch all images in parallel ─────────────────────────────────────────
  const [posterBuf, logoBuf, siteLogo] = await Promise.all([
    poster ? fetchBuffer(proxyUrl("w780", poster)) : Promise.resolve(null),
    logo ? fetchBuffer(proxyUrl("w185", logo)) : Promise.resolve(null),
    fetchBuffer(`${APP_URL}/watchedthis-logo.svg`),
  ]);

  const hasPoster = Boolean(posterBuf);

  // ── Build composites ──────────────────────────────────────────────────────
  const composites: sharp.OverlayOptions[] = [];

  // Poster — right side
  if (posterBuf) {
    const resizedPoster = await sharp(posterBuf)
      .resize(420, H, { fit: "cover", position: "centre" })
      .toBuffer();

    composites.push({ input: resizedPoster, top: 0, left: W - 420 });

    // Fade gradient over poster
    const gradientSvg = `
      <svg width="420" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#031926" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#031926" stop-opacity="0.2"/>
          </linearGradient>
        </defs>
        <rect width="420" height="${H}" fill="url(#g)"/>
      </svg>`;
    composites.push({ input: Buffer.from(gradientSvg), top: 0, left: W - 420 });
  }

  // Site logo — top left
  if (siteLogo) {
    const resizedSiteLogo = await sharp(siteLogo)
      .resize(180, 44, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    composites.push({ input: resizedSiteLogo, top: 152, left: 76 });
  }

  // Media logo badge (e.g. network logo)
  if (logoBuf) {
    const resizedLogo = await sharp(logoBuf)
      .resize(48, 48, {
        fit: "contain",
        background: { r: 13, g: 37, b: 53, alpha: 1 },
      })
      .toBuffer();
    composites.push({ input: resizedLogo, top: 216, left: 76 });
  }

  // ── Text layout ───────────────────────────────────────────────────────────
  const logoOffsetY = logoBuf ? 68 : 0;
  const titleFontSize = hasPoster ? 36 : 44;
  const titleLineHeight = titleFontSize * 1.2;
  const subtitleFontSize = 16;
  const subtitleLineHeight = subtitleFontSize * 1.6;

  const titleLines = wrapLines(title, hasPoster ? 28 : 36);
  const subtitleLines = wrapLines(subtitle, hasPoster ? 38 : 52);

  const titleStartY = 230 + logoOffsetY;
  const subtitleStartY = titleStartY + titleLines.length * titleLineHeight + 16;
  const ctaY = subtitleStartY + subtitleLines.length * subtitleLineHeight + 26;

  const titleSvgLines = titleLines
    .map(
      (line, i) =>
        `<text x="76" y="${titleStartY + i * titleLineHeight}" font-size="${titleFontSize}" font-weight="700" fill="#eef0f2" font-family="sans-serif">${esc(line)}</text>`,
    )
    .join("");

  const subtitleSvgLines = subtitleLines
    .map(
      (line, i) =>
        `<text x="76" y="${subtitleStartY + i * subtitleLineHeight}" font-size="${subtitleFontSize}" fill="#8693ab" font-family="sans-serif">${esc(line)}</text>`,
    )
    .join("");

  // ── Base SVG ──────────────────────────────────────────────────────────────
  const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="20%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#0f3a45"/>
      <stop offset="70%" stop-color="#031926"/>
    </radialGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#468189"/>
      <stop offset="100%" stop-color="#9dbebb"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Top accent bar -->
  <rect width="${W}" height="4" fill="url(#accent)"/>

  <!-- Fallback cards when no poster -->
  ${
    !hasPoster
      ? `
  <rect x="${W - 340}" y="165" width="280" height="140" rx="8" fill="#0d2535" opacity="1"/>
  <rect x="${W - 340}" y="317" width="280" height="100" rx="8" fill="#0d2535" opacity="0.85"/>
  <rect x="${W - 340}" y="429" width="280" height="80" rx="8" fill="#0d2535" opacity="0.7"/>
  `
      : ""
  }

  <!-- Title -->
  ${titleSvgLines}

  <!-- Subtitle -->
  ${subtitleSvgLines}

  <!-- CTA button -->
  <rect x="76" y="${ctaY}" width="180" height="42" rx="6" fill="#468189"/>
  <text x="166" y="${ctaY + 26}" font-size="14" font-weight="700" fill="#ffffff" font-family="sans-serif" text-anchor="middle">${esc(cta)}</text>

  <!-- Footer -->
  <text x="76" y="${H - 20}" font-size="11" fill="#637074" font-family="sans-serif">watchedthis.com</text>
</svg>`;

  // ── Compose and return ────────────────────────────────────────────────────
  const png = await sharp(Buffer.from(svg))
    .composite(composites)
    .png()
    .toBuffer();

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
    },
  });
}
