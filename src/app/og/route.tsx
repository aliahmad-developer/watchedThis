import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// ─── Scale factor trick: render at 2× then downscale via width/height ───────
// ImageResponse renders at 72 dpi. By doubling the canvas and halving via
// the returned dimensions we effectively get 2× sharpness on all displays.
const W = 1200
const H = 630
const SCALE = 2          // render at 2400 × 1260, export as 1200 × 630
const SW = W * SCALE     // 2400
const SH = H * SCALE     // 1260

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')    || 'Find Your Next Favorite Watch.'
  const subtitle = searchParams.get('subtitle') || 'Movies & TV shows, curated just for you.'
  const poster   = searchParams.get('poster')   // TMDB path e.g. /abc.jpg
  const logo     = searchParams.get('logo')     // TMDB path e.g. /xyz.png

  // Use w780 instead of w500 — higher source res for crisp downscale
  const posterUrl = poster ? `https://image.tmdb.org/t/p/w780${poster}` : null
  // Use w500 instead of w300 for logos
  const logoUrl   = logo   ? `https://image.tmdb.org/t/p/w500${logo}`   : null

  const hasPoster = Boolean(posterUrl)
  const hasLogo   = Boolean(logoUrl)

  // Font size scales with SCALE factor
  const titleSize    = (hasPoster || hasLogo ? 38 : 48) * SCALE
  const subtitleSize = 17 * SCALE
  const brandSize    = 13 * SCALE
  const ctaSize      = 15 * SCALE
  const domainSize   = 12 * SCALE

  return new ImageResponse(
    (
      <div
        style={{
          width:  `${SW}px`,
          height: `${SH}px`,
          background: '#031926',
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Top accent bar ─────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: `${SW}px`, height: `${6 * SCALE}px`,
          background: 'linear-gradient(to right, #468189, #9dbebb)',
          display: 'flex',
        }} />

        {/* ── Left accent line ───────────────────────────────── */}
        <div style={{
          position: 'absolute',
          top: `${60 * SCALE}px`, left: `${60 * SCALE}px`,
          width: `${2 * SCALE}px`, height: `${510 * SCALE}px`,
          background: 'rgba(70,129,137,0.35)',
          display: 'flex',
        }} />

        {/* ── POSTER (right side, full bleed) ───────────────── */}
        {posterUrl && (
          <div style={{
            position: 'absolute',
            right: 0, top: 0,
            width: `${420 * SCALE}px`,
            height: `${SH}px`,
            display: 'flex',
          }}>
            {/* Poster image — object-position top centres on face/title area */}
            <img
              src={posterUrl}
              style={{
                width:  `${420 * SCALE}px`,
                height: `${SH}px`,
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
            />
            {/* Gradient fade: left strong, right keeps a subtle vignette */}
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              background: `linear-gradient(
                to right,
                #031926 0%,
                rgba(3,25,38,0.85) 30%,
                rgba(3,25,38,0.3) 65%,
                rgba(3,25,38,0.08) 100%
              )`,
              display: 'flex',
            }} />
            {/* Bottom vignette so domain text stays legible */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0,
              width: '100%', height: `${120 * SCALE}px`,
              background: 'linear-gradient(to top, rgba(3,25,38,0.7) 0%, transparent 100%)',
              display: 'flex',
            }} />
          </div>
        )}

        {/* ── LEFT CONTENT ───────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft:  `${80 * SCALE}px`,
          paddingRight: hasPoster ? `${460 * SCALE}px` : `${60 * SCALE}px`,
          flex: 1,
          zIndex: 2,
        }}>

          {/* ── Brand row — your actual WatchedThis logo ──────── */}
          {/* Icon: watchedthis-logo.svg redrawn as divs (edge-safe, no img needed) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${16 * SCALE}px`,
            marginBottom: `${36 * SCALE}px`,
          }}>
            {/* Outer teal rounded square */}
            <div style={{
              width:  `${52 * SCALE}px`,
              height: `${48 * SCALE}px`,
              background: '#2a7f8a',
              borderRadius: `${8 * SCALE}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {/* Dark navy inset */}
              <div style={{
                width:  `${47 * SCALE}px`,
                height: `${43 * SCALE}px`,
                background: '#0f1e30',
                borderRadius: `${6 * SCALE}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* Cream TV body */}
                <div style={{
                  width:  `${38 * SCALE}px`,
                  height: `${30 * SCALE}px`,
                  background: '#e8e0d0',
                  borderRadius: `${5 * SCALE}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* Dark screen face */}
                  <div style={{
                    width:  `${30 * SCALE}px`,
                    height: `${22 * SCALE}px`,
                    background: '#0f1e30',
                    borderRadius: `${3 * SCALE}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    paddingLeft:  `${3 * SCALE}px`,
                    paddingRight: `${3 * SCALE}px`,
                  }}>
                    {/* Left eye */}
                    <div style={{ width: `${8 * SCALE}px`, height: `${6 * SCALE}px`, background: '#3a9aa8', borderRadius: `${1 * SCALE}px`, display: 'flex' }} />
                    {/* Right eye */}
                    <div style={{ width: `${8 * SCALE}px`, height: `${6 * SCALE}px`, background: '#3a9aa8', borderRadius: `${1 * SCALE}px`, display: 'flex' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Wordmark — matches watchedthis.svg text */}
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: `${brandSize}px`, color: '#ffffff', letterSpacing: `${-0.5 * SCALE}px`, fontWeight: 700 }}>
                Watched
              </span>
              <span style={{ fontSize: `${brandSize}px`, color: '#468189', letterSpacing: `${-0.5 * SCALE}px`, fontWeight: 700 }}>
                This
              </span>
            </div>
          </div>

          {/* Show/movie logo badge */}
          {logoUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width:  `${80 * SCALE}px`,
              height: `${80 * SCALE}px`,
              background: '#0d2535',
              borderRadius: `${10 * SCALE}px`,
              border: `${1 * SCALE}px solid #1a3a4a`,
              marginBottom: `${24 * SCALE}px`,
              overflow: 'hidden',
            }}>
              <img
                src={logoUrl}
                style={{
                  maxWidth:  `${64 * SCALE}px`,
                  maxHeight: `${64 * SCALE}px`,
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {/* Title */}
          <div style={{
            fontSize: `${titleSize}px`,
            color: '#eef0f2',
            lineHeight: 1.15,
            letterSpacing: `${-0.5 * SCALE}px`,
            marginBottom: `${14 * SCALE}px`,
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: `${540 * SCALE}px`,
            fontWeight: 700,
          }}>
            {title}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: `${subtitleSize}px`,
            color: '#8693ab',
            marginBottom: `${32 * SCALE}px`,
            display: 'flex',
            maxWidth: `${480 * SCALE}px`,
            lineHeight: 1.5,
          }}>
            {subtitle}
          </div>

          {/* CTA button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width:  `${200 * SCALE}px`,
            height: `${46 * SCALE}px`,
            background: '#468189',
            borderRadius: `${6 * SCALE}px`,
            fontSize: `${ctaSize}px`,
            fontWeight: 700,
            color: '#ffffff',
          }}>
            Discover Now →
          </div>
        </div>

        {/* ── Mock cards (shown when no poster/logo) ─────────── */}
        {!hasPoster && !hasLogo && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: `${14 * SCALE}px`,
            paddingRight: `${60 * SCALE}px`,
            width: `${340 * SCALE}px`,
            zIndex: 2,
          }}>
            {[{ h: 150, pw: 90 }, { h: 110, pw: 75 }, { h: 90, pw: 62 }].map((card, i) => (
              <div key={i} style={{
                display: 'flex',
                width:  `${290 * SCALE}px`,
                height: `${card.h * SCALE}px`,
                background: '#0d2535',
                borderRadius: `${8 * SCALE}px`,
                border: `${1 * SCALE}px solid #1a3a4a`,
                overflow: 'hidden',
                opacity: 1 - i * 0.12,
              }}>
                <div style={{
                  width: `${card.pw * SCALE}px`,
                  height: `${card.h * SCALE}px`,
                  background: '#1a3a4a',
                  display: 'flex',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', padding: `${12 * SCALE}px`, flex: 1 }}>
                  <div style={{ width: `${140 * SCALE}px`, height: `${8 * SCALE}px`, background: '#2a4a5a', borderRadius: `${3 * SCALE}px`, marginBottom: `${8 * SCALE}px`, display: 'flex' }} />
                  <div style={{ width: `${100 * SCALE}px`, height: `${8 * SCALE}px`, background: '#2a4a5a', borderRadius: `${3 * SCALE}px`, marginBottom: `${8 * SCALE}px`, display: 'flex' }} />
                  <div style={{ width: `${70 * SCALE}px`,  height: `${7 * SCALE}px`, background: '#1a3a4a', borderRadius: `${3 * SCALE}px`, marginBottom: `${10 * SCALE}px`, display: 'flex' }} />
                  <div style={{ fontSize: `${11 * SCALE}px`, color: '#468189', display: 'flex' }}>
                    {i === 0 ? '★★★★★' : '★★★★☆'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Domain watermark ───────────────────────────────── */}
        <div style={{
          position: 'absolute',
          bottom: `${24 * SCALE}px`,
          left:   `${80 * SCALE}px`,
          fontSize: `${domainSize}px`,
          color: '#637074',
          letterSpacing: `${1.5 * SCALE}px`,
          display: 'flex',
        }}>
          watchedthis.com
        </div>

        {/* ── Bottom accent ──────────────────────────────────── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          width: `${SW}px`, height: `${3 * SCALE}px`,
          background: 'rgba(70,129,137,0.3)',
          display: 'flex',
        }} />
      </div>
    ),
    {
      width:  W,   // export at 1200 — browser sees crisp 2× source
      height: H,   // export at 630
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    }
  )
}