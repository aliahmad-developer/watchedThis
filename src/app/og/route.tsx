import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')    || 'Find Your Next Favorite Watch.'
  const subtitle = searchParams.get('subtitle') || 'Movies & TV shows, curated just for you.'
  const poster   = searchParams.get('poster')  
  const logo     = searchParams.get('logo')    

  const posterUrl = poster ? `https://image.tmdb.org/t/p/w500${poster}` : null
  const logoUrl   = logo   ? `https://image.tmdb.org/t/p/w300${logo}`   : null

  return new ImageResponse(
    (
      <div style={{ width: '1200px', height: '630px', background: '#031926', display: 'flex', flexDirection: 'row', position: 'relative', overflow: 'hidden' }}>

        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '4px', background: '#468189', display: 'flex' }} />

        {/* Left accent line */}
        <div style={{ position: 'absolute', top: '70px', left: '70px', width: '2.5px', height: '490px', background: 'rgba(70,129,137,0.6)', display: 'flex' }} />

        {/* ── POSTER (movie/person) — replaces right-side cards ── */}
        {posterUrl && (
          <div style={{ position: 'absolute', right: 0, top: 0, width: '420px', height: '630px', display: 'flex' }}>
            {/* fade overlay so text on left stays readable */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, #031926 0%, transparent 40%)', zIndex: 1, display: 'flex' }} />
            <img src={posterUrl} style={{ width: '420px', height: '630px', objectFit: 'cover' }} />
          </div>
        )}

        {/* ── LEFT CONTENT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '104px', paddingTop: '20px', flex: 1, zIndex: 2 }}>

          {/* Brand */}
          <div style={{ fontSize: '16px', color: '#468189', letterSpacing: '6px', marginBottom: '44px', display: 'flex' }}>
            WATCHEDTHIS
          </div>

          {/* Company logo badge */}
          {logoUrl && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', background: '#0d2535', borderRadius: '12px', border: '1px solid #1a3a4a', marginBottom: '28px', overflow: 'hidden' }}>
              <img src={logoUrl} style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }} />
            </div>
          )}

          {/* Title */}
          <div style={{ fontSize: posterUrl || logoUrl ? '52px' : '64px', color: '#eef0f2', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', maxWidth: '640px' }}>
            {title}
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: '22px', color: '#8693ab', marginBottom: '36px', display: 'flex', maxWidth: '560px' }}>
            {subtitle}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '268px', height: '56px', background: '#468189', borderRadius: '6px', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
            Discover Now →
          </div>
        </div>

        {/* ── RIGHT MOCK CARDS (only when no poster/logo) ── */}
        {!posterUrl && !logoUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', paddingRight: '60px', width: '380px' }}>
            {[{ h: 180, pw: 110 }, { h: 120, pw: 85 }, { h: 105, pw: 75 }].map((card, i) => (
              <div key={i} style={{ display: 'flex', width: '320px', height: `${card.h}px`, background: '#0d2535', borderRadius: '8px', border: '1px solid #1a3a4a', overflow: 'hidden' }}>
                <div style={{ width: `${card.pw}px`, height: `${card.h}px`, background: '#1a3a4a', display: 'flex' }} />
                <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', flex: 1 }}>
                  <div style={{ width: '170px', height: '10px', background: '#2a4a5a', borderRadius: '3px', marginBottom: '10px', display: 'flex' }} />
                  <div style={{ width: '130px', height: '10px', background: '#2a4a5a', borderRadius: '3px', marginBottom: '10px', display: 'flex' }} />
                  <div style={{ width: '90px',  height: '9px',  background: '#1a3a4a', borderRadius: '3px', marginBottom: '14px', display: 'flex' }} />
                  <div style={{ fontSize: '13px', color: '#468189', display: 'flex' }}>{i === 0 ? '★★★★★' : '★★★★☆'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: '28px', left: '104px', fontSize: '15px', color: '#637074', letterSpacing: '2px', display: 'flex' }}>
          watchedthis.com
        </div>

        {/* Bottom accent */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '1200px', height: '4px', background: 'rgba(70,129,137,0.35)', display: 'flex' }} />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}