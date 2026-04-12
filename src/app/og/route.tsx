import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "#031926",
        display: "flex",
        flexDirection: "row",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1200px",
          height: "4px",
          background: "#468189",
          display: "flex",
        }}
      />

      {/* Left accent line */}
      <div
        style={{
          position: "absolute",
          top: "70px",
          left: "70px",
          width: "2.5px",
          height: "490px",
          background: "rgba(70,129,137,0.6)",
          display: "flex",
        }}
      />

      {/* ── LEFT CONTENT ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: "104px",
          paddingTop: "20px",
          flex: 1,
        }}
      >
        {/* Brand */}
        <div
          style={{
            fontSize: "16px",
            fontFamily: "serif",
            color: "#468189",
            letterSpacing: "6px",
            marginBottom: "52px",
          }}
        >
          WATCHEDTHIS
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "68px",
            fontFamily: "serif",
            color: "#eef0f2",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            display: "flex",
          }}
        >
          Find Your Next
        </div>
        <div
          style={{
            fontSize: "68px",
            fontFamily: "serif",
            color: "#468189",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            marginBottom: "28px",
            display: "flex",
          }}
        >
          Favorite Watch.
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: "22px",
            color: "#8693ab",
            marginBottom: "36px",
            display: "flex",
          }}
        >
          Movies &amp; TV shows — curated just for you.
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "268px",
            height: "56px",
            background: "#468189",
            borderRadius: "6px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: "32px",
          }}
        >
          Discover Now →
        </div>

        {/* Chips */}
        <div style={{ display: "flex", gap: "12px" }}>
          {["🎬 Movies", "📺 TV", "🎲 Random"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 16px",
                background: "#1a3a4a",
                borderRadius: "16px",
                fontSize: "13px",
                color: "#bdd4e7",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT CARDS ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "16px",
          paddingRight: "60px",
          width: "380px",
        }}
      >
        {/* Card 1 - large */}
        <div
          style={{
            display: "flex",
            width: "320px",
            height: "180px",
            background: "#0d2535",
            borderRadius: "8px",
            border: "1px solid #1a3a4a",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "110px",
              height: "180px",
              background: "#1a3a4a",
              display: "flex",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "18px 16px",
              flex: 1,
            }}
          >
            <div
              style={{
                width: "170px",
                height: "11px",
                background: "#2a4a5a",
                borderRadius: "3px",
                marginBottom: "10px",
                display: "flex",
              }}
            />
            <div
              style={{
                width: "130px",
                height: "11px",
                background: "#2a4a5a",
                borderRadius: "3px",
                marginBottom: "10px",
                display: "flex",
              }}
            />
            <div
              style={{
                width: "90px",
                height: "9px",
                background: "#1a3a4a",
                borderRadius: "3px",
                marginBottom: "24px",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: "14px",
                color: "#468189",
                marginBottom: "10px",
                display: "flex",
              }}
            >
              ★★★★☆
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "58px",
                height: "22px",
                background: "rgba(70,129,137,0.2)",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#468189",
              }}
            >
              MOVIE
            </div>
          </div>
        </div>

        {/* Card 2 - medium */}
        <div
          style={{
            display: "flex",
            width: "320px",
            height: "120px",
            background: "#0d2535",
            borderRadius: "8px",
            border: "1px solid #1a3a4a",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "85px",
              height: "120px",
              background: "#1a3a4a",
              display: "flex",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px",
              flex: 1,
            }}
          >
            <div
              style={{
                width: "185px",
                height: "10px",
                background: "#2a4a5a",
                borderRadius: "3px",
                marginBottom: "10px",
                display: "flex",
              }}
            />
            <div
              style={{
                width: "145px",
                height: "10px",
                background: "#2a4a5a",
                borderRadius: "3px",
                marginBottom: "10px",
                display: "flex",
              }}
            />
            <div
              style={{
                width: "100px",
                height: "9px",
                background: "#1a3a4a",
                borderRadius: "3px",
                marginBottom: "14px",
                display: "flex",
              }}
            />
            <div
              style={{ fontSize: "13px", color: "#468189", display: "flex" }}
            >
              ★★★★★
            </div>
          </div>
        </div>

        {/* Card 3 - small */}
        <div
          style={{
            display: "flex",
            width: "320px",
            height: "105px",
            background: "#0d2535",
            borderRadius: "8px",
            border: "1px solid #1a3a4a",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "75px",
              height: "105px",
              background: "#1a3a4a",
              display: "flex",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px",
              flex: 1,
            }}
          >
            <div
              style={{
                width: "195px",
                height: "10px",
                background: "#2a4a5a",
                borderRadius: "3px",
                marginBottom: "10px",
                display: "flex",
              }}
            />
            <div
              style={{
                width: "155px",
                height: "10px",
                background: "#2a4a5a",
                borderRadius: "3px",
                marginBottom: "10px",
                display: "flex",
              }}
            />
            <div
              style={{ fontSize: "13px", color: "#468189", display: "flex" }}
            >
              ★★★★☆
            </div>
          </div>
        </div>
      </div>

      {/* Domain */}
      <div
        style={{
          position: "absolute",
          bottom: "28px",
          left: "104px",
          fontSize: "15px",
          color: "#637074",
          letterSpacing: "2px",
          display: "flex",
        }}
      >
        watchedthis.com
      </div>

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "1200px",
          height: "4px",
          background: "rgba(70,129,137,0.35)",
          display: "flex",
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
