import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const W = 1200;
const H = 630;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://watchedthis.com";

// ── Font loading ──────────────────────────────────────────────────────────────
let fontBase64Cache: { regular: string; bold: string } | null = null;

async function getFontBase64(): Promise<{ regular: string; bold: string }> {
  if (fontBase64Cache) return fontBase64Cache;

  try {
    const regularPath = path.join(
      process.cwd(),
      "public/fonts/inter-regular.ttf",
    );
    const boldPath = path.join(process.cwd(), "public/fonts/inter-bold.ttf");

    if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
      fontBase64Cache = {
        regular: fs.readFileSync(regularPath).toString("base64"),
        bold: fs.readFileSync(boldPath).toString("base64"),
      };
      return fontBase64Cache;
    }
  } catch {
    // fall through to network fetch
  }

  const [regularRes, boldRes] = await Promise.all([
    fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
      { signal: AbortSignal.timeout(5000) },
    ),
    fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2",
      { signal: AbortSignal.timeout(5000) },
    ),
  ]);

  if (!regularRes.ok || !boldRes.ok) throw new Error("Font fetch failed");

  fontBase64Cache = {
    regular: Buffer.from(await regularRes.arrayBuffer()).toString("base64"),
    bold: Buffer.from(await boldRes.arrayBuffer()).toString("base64"),
  };

  return fontBase64Cache;
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
  const isHomePage = !poster && !searchParams.get("title");

  // ── Fetch all in parallel ─────────────────────────────────────────────────
  const [posterBuf, logoBuf, siteLogo, fonts] = await Promise.all([
    poster ? fetchBuffer(proxyUrl("w780", poster)) : Promise.resolve(null),
    logo ? fetchBuffer(proxyUrl("w185", logo)) : Promise.resolve(null),
    fetchBuffer(`${APP_URL}/watchedthis-logo.svg`),
    getFontBase64().catch(() => null),
  ]);

  const hasPoster = Boolean(posterBuf);
  const fontFamily = fonts ? "Inter" : "DejaVu Sans, sans-serif";

  const fontStyle = fonts
    ? `
    <style>
      @font-face {
        font-family: 'Inter';
        font-weight: 400;
        src: url('data:font/woff2;base64,${fonts.regular}') format('woff2');
      }
      @font-face {
        font-family: 'Inter';
        font-weight: 700;
        src: url('data:font/woff2;base64,${fonts.bold}') format('woff2');
      }
    </style>`
    : "";

  // ── Composites ────────────────────────────────────────────────────────────
  const composites: sharp.OverlayOptions[] = [];

  if (posterBuf) {
    // Poster as full background
    const resizedPoster = await sharp(posterBuf)
      .resize(W, H, { fit: "cover", position: "centre" })
      .toBuffer();
    composites.push({ input: resizedPoster, top: 0, left: 0 });

    // ── Improved gradient: subtle left-side scrim, poster visible on right ──
    // Only covers ~65% of width, fades from semi-opaque to fully transparent
    const gradientSvg = `
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="scrim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#031926" stop-opacity="0.93"/>
            <stop offset="40%"  stop-color="#031926" stop-opacity="0.82"/>
            <stop offset="65%"  stop-color="#031926" stop-opacity="0.45"/>
            <stop offset="85%"  stop-color="#031926" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#031926" stop-opacity="0"/>
          </linearGradient>
          <!-- Subtle vignette top/bottom -->
          <linearGradient id="vignette-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"  stop-color="#000000" stop-opacity="0.35"/>
            <stop offset="25%" stop-color="#000000" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="vignette-bot" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="75%" stop-color="#000000" stop-opacity="0"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.4"/>
          </linearGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#scrim)"/>
        <rect width="${W}" height="${H}" fill="url(#vignette-top)"/>
        <rect width="${W}" height="${H}" fill="url(#vignette-bot)"/>
      </svg>`;
    composites.push({ input: Buffer.from(gradientSvg), top: 0, left: 0 });
  }

  // Site logo
  if (siteLogo) {
    if (isHomePage) {
      // Larger, centered logo for home page
      const resizedSiteLogo = await sharp(siteLogo, { density: 300 })
        .resize(320, 78, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({
        input: resizedSiteLogo,
        top: Math.round(H / 2 - 120),
        left: Math.round(W / 2 - 160),
      });
    } else {
      // Small top-left logo for content pages
      const resizedSiteLogo = await sharp(siteLogo, { density: 300 })
        .resize(160, 38, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({ input: resizedSiteLogo, top: 44, left: 64 });
    }
  }

  // Media network logo badge (content pages only)
  if (logoBuf && !isHomePage) {
    const resizedLogo = await sharp(logoBuf)
      .resize(48, 48, {
        fit: "contain",
        background: { r: 13, g: 37, b: 53, alpha: 1 },
      })
      .toBuffer();
    composites.push({ input: resizedLogo, top: 108, left: 64 });
  }

  // ── Text layout ───────────────────────────────────────────────────────────
  const logoOffsetY = logoBuf && !isHomePage ? 68 : 0;
  const titleFontSize = 40;
  const titleLineHeight = titleFontSize * 1.22;
  const subtitleFontSize = 17;
  const subtitleLineHeight = subtitleFontSize * 1.65;

  let svg: string;

  if (isHomePage) {
    // ── Home page: centered brand layout ────────────────────────────────────
    const tagline = esc(subtitle);
    const centerY = H / 2;
    const logoBottom = centerY - 120 + 78 + 18; // logo bottom + gap

    svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="75%">
      <stop offset="0%"  stop-color="#0f3f50"/>
      <stop offset="60%" stop-color="#041e2b"/>
      <stop offset="100%" stop-color="#020f18"/>
    </radialGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#468189"/>
      <stop offset="100%" stop-color="#9dbebb"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="35%">
      <stop offset="0%"  stop-color="#468189" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#468189" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${fontStyle}

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- Soft center glow -->
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Subtle film-grain dot grid -->
  ${Array.from({ length: 18 }, (_, row) =>
    Array.from({ length: 32 }, (_, col) => {
      const x = col * 40 + 10;
      const y = row * 38 + 10;
      const opacity = (Math.sin(row * 3.7 + col * 2.1) * 0.5 + 0.5) * 0.06;
      return `<circle cx="${x}" cy="${y}" r="1" fill="#9dbebb" opacity="${opacity.toFixed(3)}"/>`;
    }).join(""),
  ).join("")}

  <!-- Top accent bar -->
  <rect width="${W}" height="4" fill="url(#accent)"/>

  <!-- Decorative horizontal rule below logo -->
  <rect x="${W / 2 - 120}" y="${logoBottom + 18}" width="240" height="1" fill="url(#accent)" opacity="0.5"/>

  <!-- Tagline -->
  <text
    x="${W / 2}" y="${logoBottom + 56}"
    font-size="18" font-weight="400"
    fill="#8ea8b0"
    font-family="${fontFamily}"
    text-anchor="middle"
    letter-spacing="0.04em"
  >${tagline}</text>

  <!-- CTA pill -->
  <rect x="${W / 2 - 90}" y="${logoBottom + 84}" width="180" height="42" rx="21" fill="#468189"/>
  <text
    x="${W / 2}" y="${logoBottom + 110}"
    font-size="14" font-weight="700"
    fill="#ffffff"
    font-family="${fontFamily}"
    text-anchor="middle"
    letter-spacing="0.06em"
  >${esc(cta.toUpperCase())}</text>

  <!-- Footer -->
  <text x="${W / 2}" y="${H - 20}" font-size="11" font-weight="400" fill="#3a5560" font-family="${fontFamily}" text-anchor="middle">watchedthis.com</text>
</svg>`;
  } else {
    // ── Content page: left-aligned text over poster ──────────────────────────
    const titleLines = wrapLines(title, 28);
    const subtitleLines = wrapLines(subtitle, 40);

    const titleStartY = 128 + logoOffsetY;
    const subtitleStartY =
      titleStartY + titleLines.length * titleLineHeight + 14;
    const ctaY =
      subtitleStartY + subtitleLines.length * subtitleLineHeight + 28;

    const titleSvgLines = titleLines
      .map(
        (line, i) =>
          `<text x="64" y="${titleStartY + i * titleLineHeight}" font-size="${titleFontSize}" font-weight="700" fill="#eef0f2" font-family="${fontFamily}">${esc(line)}</text>`,
      )
      .join("");

    const subtitleSvgLines = subtitleLines
      .map(
        (line, i) =>
          `<text x="64" y="${subtitleStartY + i * subtitleLineHeight}" font-size="${subtitleFontSize}" font-weight="400" fill="#7a93a0" font-family="${fontFamily}">${esc(line)}</text>`,
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
      <stop offset="0%" stop-color="#468189"/>
      <stop offset="100%" stop-color="#9dbebb"/>
    </linearGradient>
  </defs>
  ${fontStyle}

  <!-- Background (shows only if no poster) -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Top accent bar -->
  <rect width="${W}" height="4" fill="url(#accent)"/>

  <!-- Title -->
  ${titleSvgLines}

  <!-- Subtitle -->
  ${subtitleSvgLines}

  <!-- CTA button -->
  <rect x="64" y="${ctaY}" width="178" height="42" rx="6" fill="#468189"/>
  <text x="153" y="${ctaY + 26}" font-size="13" font-weight="700" fill="#ffffff" font-family="${fontFamily}" text-anchor="middle">${esc(cta)}</text>

  <!-- Footer -->
  <text x="64" y="${H - 20}" font-size="11" font-weight="400" fill="#637074" font-family="${fontFamily}">watchedthis.com</text>
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
