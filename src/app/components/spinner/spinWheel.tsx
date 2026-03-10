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

  // Pointer dims — identical in both skeleton and real wheel
  const ptrH = 28;
  const ptrW = 24;
  // Pointer tip sits exactly at the rim: cy - r
  const ptrTipY = cy - r;
  // Group is translated so that the tip point (0, ptrH) lands at (cx, ptrTipY)
  const ptrTransY = ptrTipY - ptrH;

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

  // ── Shared Pointer markup (same transform for both skeleton + real) ──────
  const PointerEl = ({ faded = false }: { faded?: boolean }) => (
    <g transform={`translate(${cx}, ${ptrTransY})`}>
      {/* Drop shadow */}
      <polygon
        points={`0,${ptrH + 2} ${-ptrW / 2 - 1},-1 ${ptrW / 2 + 1},-1`}
        fill={faded ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.35)"}
        transform="translate(1,2)"
      />
      {/* Main body */}
      <polygon
        points={`0,${ptrH} ${-ptrW / 2},0 ${ptrW / 2},0`}
        style={{ fill: faded ? undefined : "var(--color-light-nav)" }}
        fill={faded ? "rgba(128,128,128,0.35)" : undefined}
        className={faded ? "" : "dark:fill-dark-card"}
        stroke={faded ? "rgba(128,128,128,0.2)" : "rgba(255,255,255,0.15)"}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Highlight */}
      <polygon
        points={`0,${ptrH - 6} ${-ptrW / 2 + 4},3 ${ptrW / 2 - 4},3`}
        fill={faded ? "rgba(128,128,128,0.08)" : "rgba(255,255,255,0.08)"}
      />
    </g>
  );

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
            {/* Dark mode shimmer */}
            <linearGradient id="shimmerDark" x1="0%" y1="0%" x2="100%" y2="0%">
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
            {/* Light mode shimmer */}
            <linearGradient id="shimmerLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.03)" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.03)" />
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
            const tx =
              Math.round((cx + (r - 20) * Math.cos(midRad)) * 1000) / 1000;
            const ty =
              Math.round((cy + (r - 20) * Math.sin(midRad)) * 1000) / 1000;
            const barW = 40 + (i % 3) * 12;
            const barH = 6;

            return (
              <g key={i}>
                {/* Base fill — visible in both light and dark */}
                <path
                  d={path}
                  className={
                    i % 2 === 0
                      ? "fill-[rgba(0,0,0,0.08)] dark:fill-[rgba(255,255,255,0.06)]"
                      : "fill-[rgba(0,0,0,0.05)] dark:fill-[rgba(255,255,255,0.03)]"
                  }
                  stroke="rgba(128,128,128,0.15)"
                  strokeWidth="1"
                />
                {/* Shimmer overlay — light mode */}
                <path
                  d={path}
                  fill="url(#shimmerLight)"
                  className="dark:hidden"
                />
                {/* Shimmer overlay — dark mode */}
                <path
                  d={path}
                  fill="url(#shimmerDark)"
                  className="hidden dark:block"
                />
                {/* Text bar placeholder */}
                <rect
                  x={-barW / 2}
                  y={-barH / 2}
                  width={barW}
                  height={barH}
                  rx={barH / 2}
                  className="fill-[rgba(0,0,0,0.12)] dark:fill-[rgba(255,255,255,0.12)]"
                  transform={`translate(${tx},${ty}) rotate(${midDeg + 180})`}
                />
              </g>
            );
          })}

          {/* Rim */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="stroke-[rgba(0,0,0,0.12)] dark:stroke-[rgba(255,255,255,0.08)]"
            strokeWidth="5"
          />

          {/* Pointer — same position as real wheel */}
          <PointerEl faded />

          {/* Centre cap */}
          <circle
            cx={cx}
            cy={cy}
            r={innerR}
            className="fill-[rgba(0,0,0,0.08)] dark:fill-[rgba(255,255,255,0.06)]"
            stroke="rgba(128,128,128,0.2)"
            strokeWidth="2"
          />

          {/* Loading label */}
          <text
            x={cx}
            y={cy + r + 28}
            textAnchor="middle"
            className="fill-[rgba(0,0,0,0.3)] dark:fill-[rgba(255,255,255,0.3)]"
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
            const tx =
              Math.round((cx + txtDist * Math.cos(midRad)) * 1000) / 1000;
            const ty =
              Math.round((cy + txtDist * Math.sin(midRad)) * 1000) / 1000;
            const txtRot = midDeg + 180;

            const label = item?.title
              ? item.title.length > 16
                ? item.title.slice(0, 15) + "…"
                : item.title
              : `Slot ${i + 1}`;

            return (
              <g key={i}>
                <path
                  d={path}
                  fill={COLORS[i % COLORS.length]}
                  opacity={item ? 1 : 0.35}
                />
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
                {url && <path d={path} fill="rgba(0,0,0,0.28)" />}
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="1"
                />
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

        {/* ── Pointer — same component, same position ──────────────────── */}
        <PointerEl />

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
