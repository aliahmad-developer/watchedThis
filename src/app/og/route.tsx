import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const W = 1200;
const H = 630;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://watchedthis.com";

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

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      cache: "force-cache",
    });

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

  const isHomePage = !poster && !title;

  const effectiveTitle = title || "Find Your Next Favorite Watch.";

  // ── Fetch assets ──────────────────────────────────────────────────────────

  const [posterBuf, logoBuf, siteLogo] = await Promise.all([
    poster ? fetchBuffer(proxyUrl("w780", poster)) : Promise.resolve(null),

    logo ? fetchBuffer(proxyUrl("w185", logo)) : Promise.resolve(null),

    fetchBuffer(`${APP_URL}/watchedthis-logo.png`),
  ]);

  const composites: sharp.OverlayOptions[] = [];

  // ── Poster panel ──────────────────────────────────────────────────────────

  if (!isHomePage) {
    const PANEL_W = 500;

    const PANEL_X = W - PANEL_W;

    let artwork: Buffer | null = posterBuf;

    // fallback logo
    if (!artwork && siteLogo) {
      artwork = await sharp(siteLogo)
        .resize(340, 340, {
          fit: "contain",
        })
        .png()
        .toBuffer();
    }

    if (artwork) {
      const fittedArtwork = await sharp(artwork)
        .resize(PANEL_W - 40, H - 40, {
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

      const meta = await sharp(fittedArtwork).metadata();

      const artW = meta.width || 0;

      const artH = meta.height || 0;

      const left = PANEL_X + Math.round((PANEL_W - artW) / 2);

      const top = Math.round((H - artH) / 2);

      composites.push({
        input: fittedArtwork,
        left,
        top,
      });

      // left fade
      const fadeSvg = `
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#031926" stop-opacity="1"/>
            <stop offset="52%" stop-color="#031926" stop-opacity="1"/>
            <stop offset="70%" stop-color="#031926" stop-opacity="0.82"/>
            <stop offset="85%" stop-color="#031926" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#031926" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <rect width="${W}" height="${H}" fill="url(#fade)"/>
      </svg>`;

      composites.push({
        input: Buffer.from(fadeSvg),
        top: 0,
        left: 0,
      });
    }
  }

  // ── Site logo ─────────────────────────────────────────────────────────────

  if (siteLogo) {
    const logoW = isHomePage ? 300 : 150;

    const logoH = isHomePage ? 72 : 36;

    const resizedSiteLogo = await sharp(siteLogo)
      .resize(logoW, logoH, {
        fit: "contain",
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
      composites.push({
        input: resizedSiteLogo,
        top: 44,
        left: 60,
      });
    }
  }

  // ── Network logo ──────────────────────────────────────────────────────────

  if (logoBuf && !isHomePage) {
    const resizedLogo = await sharp(logoBuf)
      .resize(44, 44, {
        fit: "contain",
      })
      .png()
      .toBuffer();

    composites.push({
      input: resizedLogo,
      top: 104,
      left: 60,
    });
  }

  // ── SVG generation ────────────────────────────────────────────────────────

  let svg = "";

  if (isHomePage) {
    const tagline = esc(subtitle);

    const midY = H / 2;

    const ruleY = midY - 50;

    const taglineY = midY + 10;

    const ctaY = midY + 46;

    svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">

  <defs>
    <radialGradient id="bg" cx="50%" cy="44%" r="70%">
      <stop offset="0%" stop-color="#0f3f50"/>
      <stop offset="55%" stop-color="#041e2b"/>
      <stop offset="100%" stop-color="#020f18"/>
    </radialGradient>

    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#468189"/>
      <stop offset="100%" stop-color="#9dbebb"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <rect width="${W}" height="4" fill="url(#accent)"/>

  <rect
    x="${W / 2 - 110}"
    y="${ruleY}"
    width="220"
    height="1"
    fill="#468189"
    opacity="0.45"
  />

  <text
    x="${W / 2}"
    y="${taglineY}"
    font-size="20"
    fill="#8ea9b2"
    font-family="Arial, Helvetica, sans-serif"
    text-anchor="middle"
  >
    ${tagline}
  </text>

  <rect
    x="${W / 2 - 95}"
    y="${ctaY}"
    width="190"
    height="44"
    rx="22"
    fill="#468189"
  />

  <text
    x="${W / 2}"
    y="${ctaY + 28}"
    font-size="14"
    font-weight="700"
    fill="#ffffff"
    font-family="Arial, Helvetica, sans-serif"
    text-anchor="middle"
  >
    ${esc(cta)}
  </text>

</svg>`;
  } else {
    const logoOffsetY = logoBuf ? 60 : 0;

    const titleFontSize = 42;

    const titleLineH = titleFontSize * 1.2;

    const subFontSize = 18;

    const subLineH = subFontSize * 1.6;

    const titleLines = wrapLines(effectiveTitle, 26);

    const subtitleLines = wrapLines(subtitle, 38);

    const titleStartY = 140 + logoOffsetY;

    const subStartY = titleStartY + titleLines.length * titleLineH + 20;

    const ctaY = subStartY + subtitleLines.length * subLineH + 30;

    const titleSvg = titleLines
      .map(
        (line, i) => `
        <text
          x="60"
          y="${titleStartY + i * titleLineH}"
          font-size="${titleFontSize}"
          font-weight="700"
          fill="#eef0f2"
          font-family="Arial, Helvetica, sans-serif"
        >
          ${esc(line)}
        </text>
      `,
      )
      .join("");

    const subSvg = subtitleLines
      .map(
        (line, i) => `
        <text
          x="60"
          y="${subStartY + i * subLineH}"
          font-size="${subFontSize}"
          fill="#8aa0a8"
          font-family="Arial, Helvetica, sans-serif"
        >
          ${esc(line)}
        </text>
      `,
      )
      .join("");

    svg = `
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

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <rect width="${W}" height="4" fill="url(#accent)"/>

  ${titleSvg}

  ${subSvg}

  <rect
    x="60"
    y="${ctaY}"
    width="180"
    height="42"
    rx="8"
    fill="#468189"
  />

  <text
    x="150"
    y="${ctaY + 27}"
    font-size="14"
    font-weight="700"
    fill="#ffffff"
    font-family="Arial, Helvetica, sans-serif"
    text-anchor="middle"
  >
    ${esc(cta)}
  </text>

</svg>`;
  }

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
