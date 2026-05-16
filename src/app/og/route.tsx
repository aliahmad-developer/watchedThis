import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const W = 1200;
const H = 630;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://watchedthis.com";

// ── librsvg-safe font loading ─────────────────────────────────────────────────
// sharp uses librsvg which does NOT support woff2 @font-face in SVG.
// We load TTF files and embed them as base64 — librsvg supports TTF/OTF only.
let fontCache: { regular: string; bold: string } | null = null;

async function getFonts(): Promise<{ regular: string; bold: string } | null> {
  if (fontCache) return fontCache;

  try {
    const regularPath = path.join(
      process.cwd(),
      "public/fonts/inter-regular.ttf",
    );
    const boldPath = path.join(process.cwd(), "public/fonts/inter-bold.ttf");

    if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
      fontCache = {
        regular: fs.readFileSync(regularPath).toString("base64"),
        bold: fs.readFileSync(boldPath).toString("base64"),
      };
      return fontCache;
    }
  } catch {
    // no local fonts
  }

  // Try fetching TTF from Google Fonts (not woff2 — librsvg needs TTF/OTF)
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
      fontCache = {
        regular: Buffer.from(await r.arrayBuffer()).toString("base64"),
        bold: Buffer.from(await b.arrayBuffer()).toString("base64"),
      };
      return fontCache;
    }
  } catch {
    // fall through
  }

  return null; // use librsvg system sans-serif
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function proxyUrl(size: string, p: string): string {
  const cleanPath = p.startsWith("/") ? p : `/${p}`;
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

// Build font-face block for SVG — TTF/OTF only (librsvg limitation)
function buildFontStyle(fonts: { regular: string; bold: string } | null): {
  style: string;
  family: string;
} {
  if (!fonts) return { style: "", family: "sans-serif" };
  return {
    style: `
      <style>
        @font-face {
          font-family: 'Inter';
          font-weight: 400;
          src: url('data:font/truetype;base64,${fonts.regular}') format('truetype');
        }
        @font-face {
          font-family: 'Inter';
          font-weight: 700;
          src: url('data:font/truetype;base64,${fonts.bold}') format('truetype');
        }
      </style>`,
    family: "Inter, sans-serif",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const title = clampText(searchParams.get("title") || "", 90);
  const subtitle = clampText(
    searchParams.get("subtitle") || "Movies & TV shows, curated just for you.",
    140,
  );
  const poster = searchParams.get("poster");
  const logo = searchParams.get("logo");
  const cta = searchParams.get("cta") || "Discover Now →";

  // Is this the brand/home OG (no poster, no title)?
  const isHomePage = !poster && !title;

  const effectiveTitle = title || "Find Your Next Favorite Watch.";

  // ── Fetch in parallel ─────────────────────────────────────────────────────
  const [posterBuf, logoBuf, siteLogo, fonts] = await Promise.all([
    poster ? fetchBuffer(proxyUrl("w780", poster)) : Promise.resolve(null),
    logo ? fetchBuffer(proxyUrl("w185", logo)) : Promise.resolve(null),
    fetchBuffer(`${APP_URL}/watchedthis-logo.svg`),
    getFonts().catch(() => null),
  ]);

  const hasPoster = Boolean(posterBuf);
  const { style: fontStyle, family: fontFamily } = buildFontStyle(fonts);

  // ── Composites ────────────────────────────────────────────────────────────
  const composites: sharp.OverlayOptions[] = [];

  if (posterBuf && !isHomePage) {
    // ── Show full poster on the RIGHT — fit: contain with dark bg padding ───
    // This avoids cropping: poster is scaled to fit inside a box, letterboxed.
    const POSTER_W = 480;
    const POSTER_H = H; // full height slot on the right

    const resizedPoster = await sharp(posterBuf)
      .resize(POSTER_W, POSTER_H, {
        fit: "contain", // ← no cropping, full image visible
        position: "centre",
        background: { r: 3, g: 25, b: 38, alpha: 1 }, // match bg color
      })
      .toBuffer();

    composites.push({ input: resizedPoster, top: 0, left: W - POSTER_W });

    // Soft left-edge fade so poster blends into the text panel
    const fadeSvg = `
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#031926" stop-opacity="1"/>
            <stop offset="45%"  stop-color="#031926" stop-opacity="1"/>
            <stop offset="62%"  stop-color="#031926" stop-opacity="0.7"/>
            <stop offset="75%"  stop-color="#031926" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#031926" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#fade)"/>
      </svg>`;
    composites.push({ input: Buffer.from(fadeSvg), top: 0, left: 0 });
  }

  // Site logo
  if (siteLogo) {
    const logoW = isHomePage ? 300 : 150;
    const logoH = isHomePage ? 72 : 36;

    const resizedSiteLogo = await sharp(siteLogo, { density: 300 })
      .resize(logoW, logoH, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    if (isHomePage) {
      composites.push({
        input: resizedSiteLogo,
        top: Math.round(H / 2 - 130),
        left: Math.round(W / 2 - logoW / 2),
      });
    } else {
      composites.push({ input: resizedSiteLogo, top: 44, left: 60 });
    }
  }

  // Network logo badge (content pages only)
  if (logoBuf && !isHomePage) {
    const resizedLogo = await sharp(logoBuf)
      .resize(44, 44, {
        fit: "contain",
        background: { r: 13, g: 37, b: 53, alpha: 1 },
      })
      .toBuffer();
    composites.push({ input: resizedLogo, top: 104, left: 60 });
  }

  // ── SVG: Home page ────────────────────────────────────────────────────────
  let svg: string;

  if (isHomePage) {
    const tagline = esc(subtitle);
    const midY = H / 2;
    // logo sits at midY-130, is 72px tall → bottom at midY-58
    const ruleY = midY - 50;
    const taglineY = midY + 10;
    const ctaY = midY + 46;

    svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="44%" r="70%">
      <stop offset="0%"   stop-color="#0f3f50"/>
      <stop offset="55%"  stop-color="#041e2b"/>
      <stop offset="100%" stop-color="#020f18"/>
    </radialGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#468189"/>
      <stop offset="100%" stop-color="#9dbebb"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="32%">
      <stop offset="0%"   stop-color="#468189" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#468189" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${fontStyle}

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Top accent bar -->
  <rect width="${W}" height="4" fill="url(#accent)"/>

  <!-- Horizontal rule below logo -->
  <rect x="${W / 2 - 110}" y="${ruleY}" width="220" height="1" fill="#468189" opacity="0.45"/>

  <!-- Tagline -->
  <text
    x="${W / 2}" y="${taglineY}"
    font-size="19" font-weight="400"
    fill="#7a9faa"
    font-family="${fontFamily}"
    text-anchor="middle"
    letter-spacing="1"
  >${tagline}</text>

  <!-- CTA pill -->
  <rect x="${W / 2 - 95}" y="${ctaY}" width="190" height="44" rx="22" fill="#468189"/>
  <text
    x="${W / 2}" y="${ctaY + 28}"
    font-size="14" font-weight="700"
    fill="#ffffff"
    font-family="${fontFamily}"
    text-anchor="middle"
    letter-spacing="1.5"
  >${esc(cta)}</text>

  <!-- Footer -->
  <text
    x="${W / 2}" y="${H - 22}"
    font-size="11" font-weight="400"
    fill="#2e4f5c"
    font-family="${fontFamily}"
    text-anchor="middle"
  >watchedthis.com</text>
</svg>`;
  } else {
    // ── SVG: Content page (movie/show/person) ─────────────────────────────
    const logoOffsetY = logoBuf ? 60 : 0;
    const titleFontSize = 38;
    const titleLineH = titleFontSize * 1.22;
    const subFontSize = 16;
    const subLineH = subFontSize * 1.65;

    const titleLines = wrapLines(effectiveTitle, 26);
    const subtitleLines = wrapLines(subtitle, 38);

    const titleStartY = 126 + logoOffsetY;
    const subStartY = titleStartY + titleLines.length * titleLineH + 14;
    const ctaY = subStartY + subtitleLines.length * subLineH + 28;

    const titleSvg = titleLines
      .map(
        (line, i) =>
          `<text x="60" y="${titleStartY + i * titleLineH}" font-size="${titleFontSize}" font-weight="700" fill="#eef0f2" font-family="${fontFamily}">${esc(line)}</text>`,
      )
      .join("");

    const subSvg = subtitleLines
      .map(
        (line, i) =>
          `<text x="60" y="${subStartY + i * subLineH}" font-size="${subFontSize}" font-weight="400" fill="#7a93a0" font-family="${fontFamily}">${esc(line)}</text>`,
      )
      .join("");

    svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="20%" cy="20%" r="80%">
      <stop offset="0%"  stop-color="#0f3a45"/>
      <stop offset="70%" stop-color="#031926"/>
    </radialGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#468189"/>
      <stop offset="100%" stop-color="#9dbebb"/>
    </linearGradient>
  </defs>
  ${fontStyle}

  <!-- Solid dark bg (shows where no poster) -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Top accent bar -->
  <rect width="${W}" height="4" fill="url(#accent)"/>

  ${titleSvg}
  ${subSvg}

  <!-- CTA button -->
  <rect x="60" y="${ctaY}" width="178" height="42" rx="6" fill="#468189"/>
  <text
    x="149" y="${ctaY + 26}"
    font-size="13" font-weight="700"
    fill="#ffffff"
    font-family="${fontFamily}"
    text-anchor="middle"
  >${esc(cta)}</text>

  <!-- Footer -->
  <text x="60" y="${H - 22}" font-size="11" font-weight="400" fill="#637074" font-family="${fontFamily}">watchedthis.com</text>
</svg>`;
  }

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
