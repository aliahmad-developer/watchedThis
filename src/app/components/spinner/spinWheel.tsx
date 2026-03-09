"use client";

import { useRef } from "react";
import { SpinnerItem } from "./types";

interface SpinWheelProps {
  slots: (SpinnerItem | null)[];
  rotation: number;
  isSpinning: boolean;
  loading: boolean;
  onRemoveSlot?: (item: SpinnerItem) => void;
}

const COLORS = [
  "#e879a0",
  "#7c6af7",
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
  "#8b5cf6",
  "#84cc16",
  "#e879a0",
  "#7c6af7",
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
];

const SKELETON_COUNT = 20;

const imgUrl = (item: SpinnerItem) => {
  if (item.backdrop_path)
    return `https://image.tmdb.org/t/p/w780${item.backdrop_path}`;
  if (item.poster_path)
    return `https://image.tmdb.org/t/p/w342${item.poster_path}`;
  return null;
};

export default function SpinWheel({
  slots,
  rotation,
  isSpinning,
  loading,
  onRemoveSlot,
}: SpinWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const count = loading ? SKELETON_COUNT : slots.length;
  const degPerSlice = 360 / count;

  const size = 480;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const innerR = 12;

  const toRad = (d: number) => d * (Math.PI / 180);

  const slicePath = (i: number, customR = r, customInner = innerR) => {
    const a1 = toRad(degPerSlice * i - 90);
    const a2 = toRad(degPerSlice * (i + 1) - 90);
    const large = degPerSlice > 180 ? 1 : 0;
    const ox1 = cx + customR * Math.cos(a1),
      oy1 = cy + customR * Math.sin(a1);
    const ox2 = cx + customR * Math.cos(a2),
      oy2 = cy + customR * Math.sin(a2);
    const ix1 = cx + customInner * Math.cos(a1),
      iy1 = cy + customInner * Math.sin(a1);
    const ix2 = cx + customInner * Math.cos(a2),
      iy2 = cy + customInner * Math.sin(a2);
    return [
      `M ${ix1} ${iy1}`,
      `L ${ox1} ${oy1}`,
      `A ${customR} ${customR} 0 ${large} 1 ${ox2} ${oy2}`,
      `L ${ix2} ${iy2}`,
      `A ${customInner} ${customInner} 0 ${large} 0 ${ix1} ${iy1}`,
      "Z",
    ].join(" ");
  };
  const ptrH = 28;
  const ptrW = 24;

  // ── SKELETON ──────────────────────────────────────────────────────────────
  if (loading) {
    const skeletonSlices = Array.from({ length: SKELETON_COUNT }, (_, i) => i);
    return (
      <div
        className="relative w-full max-w-120 mx-auto"
        style={{ aspectRatio: "1 / 1" }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="-1 0"
                to="1 0"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          {skeletonSlices.map((i) => {
            const path = slicePath(i);
            const midDeg = degPerSlice * i - 90 + degPerSlice / 2;
            const midRad = toRad(midDeg);
            const tx = cx + (r - 20) * Math.cos(midRad);
            const ty = cy + (r - 20) * Math.sin(midRad);
            const barW = 40 + (i % 3) * 12;
            const barH = 6;
            return (
              <g key={i}>
                <path
                  d={path}
                  fill={
                    i % 2 === 0
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.03)"
                  }
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <path d={path} fill="url(#shimmer)" />
                <rect
                  x={-barW / 2}
                  y={-barH / 2}
                  width={barW}
                  height={barH}
                  rx={barH / 2}
                  fill="rgba(255,255,255,0.12)"
                  transform={`translate(${tx},${ty}) rotate(${midDeg + 180})`}
                />
              </g>
            );
          })}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="5"
          />
          <g transform={`translate(${cx}, ${cy - r - ptrH + 10})`}>
            <polygon
              points={`${ptrW / 2},${ptrH} 0,0 ${ptrW},0`}
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </g>
          <circle
            cx={cx}
            cy={cy}
            r={innerR}
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />
          <text
            x={cx}
            y={cy + r + 28}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="13"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
            letterSpacing="2"
          >
            LOADING MEDIA…
          </text>
        </svg>
      </div>
    );
  }

  // ── MAIN WHEEL ────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-120 mx-auto"
      style={{ aspectRatio: "1 / 1" }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: "block", overflow: "visible" }}
        onContextMenu={(e) => {
          if (!onRemoveSlot || isSpinning) return;
          e.preventDefault();
          const rect = (
            e.currentTarget as SVGSVGElement
          ).getBoundingClientRect();
          const scaleX = size / rect.width;
          const scaleY = size / rect.height;
          const ox = (e.clientX - rect.left) * scaleX - cx;
          const oy = (e.clientY - rect.top) * scaleY - cy;
          const dist = Math.sqrt(ox * ox + oy * oy);
          if (dist < innerR || dist > r) return;
          const raw = ((Math.atan2(oy, ox) * 180) / Math.PI + 360) % 360;
          const corrected = (raw - (rotation % 360) + 360 + 90) % 360;
          const idx = Math.floor(corrected / degPerSlice) % slots.length;
          const item = slots[idx];
          if (item) onRemoveSlot(item);
        }}
      >
        <defs>
          <filter id="ptrShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="rgba(0,0,0,0.5)"
            />
          </filter>
          {/* Per-slice clip paths */}
          {slots.map((_, i) => (
            <clipPath key={i} id={`cp-${i}`}>
              <path d={slicePath(i)} />
            </clipPath>
          ))}
        </defs>

        {/* ── Spinning group ─────────────────────────────────────────────── */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)"
              : "none",
          }}
        >
          {slots.map((item, i) => {
            const path = slicePath(i);
            const midDeg = degPerSlice * i - 90 + degPerSlice / 2;
            const midRad = toRad(midDeg);
            const url = item ? imgUrl(item) : null;

            const txtDist = r - 16;
            const tx = cx + txtDist * Math.cos(midRad);
            const ty = cy + txtDist * Math.sin(midRad);
            const txtRot = midDeg + 180;

            const label = item?.title
              ? item.title.length > 16
                ? item.title.slice(0, 15) + "…"
                : item.title
              : `Slot ${i + 1}`;

            return (
              <g key={i}>
                {/* 1. Base colour */}
                <path
                  d={path}
                  fill={COLORS[i % COLORS.length]}
                  opacity={item ? 1 : 0.35}
                />

                {/*
                  2. Image — rotate this <g> so that 12 o'clock lines up with
                     this slice's midpoint. The template clipPath (also at
                     12 o'clock) is now in the exact same coordinate space as
                     the image tile, so they always align perfectly.
                     midDeg already accounts for the -90° offset (it's the
                     true angle to this slice's centre from the top), so we
                     just add 90° back to compensate for the tile starting at
                     -90° (pointing straight up).
                */}
                {url && (
                  <image
                    href={url}
                    x={cx - r}
                    y={cy - r}
                    width={r * 2}
                    height={r * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#cp-${i})`}
                  />
                )}

                {/* 3. Readability overlay */}
                {url && <path d={path} fill="rgba(0,0,0,0.28)" />}

                {/* 4. Slice border */}
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="1"
                />

                {/* 5. Title */}
                <text
                  x={tx}
                  y={ty}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fill="white"
                  stroke="rgba(0,0,0,0.75)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="0.2"
                  transform={`rotate(${txtRot}, ${tx}, ${ty})`}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Light mode tint only */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            className="fill-[rgba(255,255,255,0.15)] dark:fill-[rgba(0,0,0,0)]"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="stroke-[rgba(0,0,0,0.5)] dark:stroke-[rgba(0,0,0,0.8)]"
            strokeWidth="6"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r + 4}
            fill="none"
            className="stroke-[rgba(0,0,0,0.15)] dark:stroke-[rgba(255,255,255,0.07)]"
            strokeWidth="2"
          />
        </g>

        {/* ── Pointer ─────────────────────────────────────────────────────── */}
        {/* ── Pointer ─────────────────────────────────────────────────────── */}
        {/* Tip is at local (0, ptrH), base centred on x=0 → global tip lands exactly at (cx, cy-r+10) */}
        <g transform={`translate(${cx}, ${cy - r - ptrH + 10})`}>
          <polygon
            points={`0,${ptrH + 2} ${-ptrW / 2 - 1},-1 ${ptrW / 2 + 1},-1`}
            fill="rgba(0,0,0,0.35)"
            transform="translate(1,2)"
          />
          <polygon
            points={`0,${ptrH} ${-ptrW / 2},0 ${ptrW / 2},0`}
            style={{ fill: "var(--color-light-nav)" }}
            className="dark:fill-dark-card"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <polygon
            points={`0,${ptrH - 6} ${-ptrW / 2 + 4},3 ${ptrW / 2 - 4},3`}
            fill="rgba(255,255,255,0.08)"
          />
        </g>

        {/* ── Centre cap ──────────────────────────────────────────────────── */}
        <circle
          cx={cx}
          cy={cy}
          r={11}
          className="fill-[rgba(0,0,0,0.55)] dark:fill-[rgba(255,255,255,0.08)]"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.5"
        />
        <circle cx={cx} cy={cy} r={4} fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>
  );
}
