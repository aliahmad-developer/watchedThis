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
      <div style={{
        width: '1200px',
        height: '630px',
        background: '#031926',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Top accent bar */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '1200px', height: '3px',
          background: '#468189',
          display: 'flex'
        }} />

        {/* Left accent line */}
        <div style={{
          position: 'absolute',
          top: '60px', left: '60px',
          width: '2px', height: '510px',
          background: 'rgba(70,129,137,0.4)',
          display: 'flex'
        }} />

        {/* POSTER */}
        {posterUrl && (
          <div style={{
            position: 'absolute',
            right: 0, top: 0,
            width: '380px', height: '630px',
            display: 'flex'
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              background: 'linear-gradient(to right, #031926 0%, transparent 50%)',
              zIndex: 1,
              display: 'flex'
            }} />
            <img
              src={posterUrl}
              style={{ width: '380px', height: '630px', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* LEFT CONTENT */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: '80px',
          paddingRight: posterUrl ? '420px' : '60px',
          flex: 1,
          zIndex: 2
        }}>

          {/* Brand row — TV icon badge + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>

            {/* TV icon badge (inline SVG via img — edge runtime safe) */}
            <div style={{
              width: '40px', height: '40px',
              background: '#031926',
              borderRadius: '8px',
              border: '1.5px solid #1a3a4a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {/* TV body */}
              <div style={{
                width: '28px', height: '24px',
                background: '#ede9e0',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {/* Screen */}
                <div style={{
                  width: '20px', height: '13px',
                  background: '#0c1e2c',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  paddingLeft: '2px',
                  paddingRight: '2px',
                }}>
                  {/* Left eye */}
                  <div style={{ width: '4px', height: '3px', background: '#468189', borderRadius: '0.5px', display: 'flex' }} />
                  {/* Right eye half-lidded */}
                  <div style={{ width: '4px', height: '3px', background: '#468189', borderRadius: '0.5px', display: 'flex', opacity: 0.6 }} />
                </div>
              </div>
            </div>

            {/* Wordmark text */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px' }}>
              <span style={{ fontSize: '13px', color: '#eef0f2', letterSpacing: '3px', fontWeight: 600 }}>
                WATCHED
              </span>
              <span style={{ fontSize: '13px', color: '#468189', letterSpacing: '3px', fontWeight: 600 }}>
                THIS
              </span>
            </div>
          </div>

          {/* Show/movie logo badge */}
          {logoUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '70px', height: '70px',
              background: '#0d2535',
              borderRadius: '10px',
              border: '1px solid #1a3a4a',
              marginBottom: '24px',
              overflow: 'hidden'
            }}>
              <img
                src={logoUrl}
                style={{ maxWidth: '55px', maxHeight: '55px', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Title */}
          <div style={{
            fontSize: posterUrl || logoUrl ? '38px' : '48px',
            color: '#eef0f2',
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
            marginBottom: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: '520px',
            fontWeight: 600
          }}>
            {title}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '17px',
            color: '#8693ab',
            marginBottom: '28px',
            display: 'flex',
            maxWidth: '460px',
            lineHeight: 1.4
          }}>
            {subtitle}
          </div>

          {/* CTA */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '200px', height: '44px',
            background: '#468189',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff'
          }}>
            Discover Now →
          </div>
        </div>

        {/* Mock cards (no poster/logo) */}
        {!posterUrl && !logoUrl && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '12px',
            paddingRight: '50px',
            width: '320px'
          }}>
            {[{ h: 150, pw: 90 }, { h: 100, pw: 70 }, { h: 85, pw: 60 }].map((card, i) => (
              <div key={i} style={{
                display: 'flex',
                width: '280px', height: `${card.h}px`,
                background: '#0d2535',
                borderRadius: '8px',
                border: '1px solid #1a3a4a',
                overflow: 'hidden'
              }}>
                <div style={{ width: `${card.pw}px`, height: `${card.h}px`, background: '#1a3a4a', display: 'flex' }} />
                <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', flex: 1 }}>
                  <div style={{ width: '140px', height: '8px', background: '#2a4a5a', borderRadius: '3px', marginBottom: '8px', display: 'flex' }} />
                  <div style={{ width: '100px', height: '8px', background: '#2a4a5a', borderRadius: '3px', marginBottom: '8px', display: 'flex' }} />
                  <div style={{ width: '70px', height: '7px', background: '#1a3a4a', borderRadius: '3px', marginBottom: '10px', display: 'flex' }} />
                  <div style={{ fontSize: '11px', color: '#468189', display: 'flex' }}>
                    {i === 0 ? '★★★★★' : '★★★★☆'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Domain */}
        <div style={{
          position: 'absolute',
          bottom: '24px', left: '80px',
          fontSize: '12px',
          color: '#637074',
          letterSpacing: '1.5px',
          display: 'flex'
        }}>
          watchedthis.com
        </div>

        {/* Bottom accent */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          width: '1200px', height: '3px',
          background: 'rgba(70,129,137,0.3)',
          display: 'flex'
        }} />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}