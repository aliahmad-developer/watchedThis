"use client";

import { useRef, useMemo, memo } from "react";
import { SpinnerItem } from "./types";
import { tmdbImage } from "@/lib/imageTmdb";
interface SpinWheelProps {
  slots: (SpinnerItem | null)[];
  rotation: number;
  isSpinning: boolean;
  loading: boolean;
  onRemoveSlot?: (item: SpinnerItem) => void;
}
const round = (n: number) => Math.round(n * 1000) / 1000;

function buildSlicePath(
  i: number,
  degPerSlice: number,
  customR = R,
  customInner = INNER_R,
) {
  const a1 = toRad(degPerSlice * i - 90);
  const a2 = toRad(degPerSlice * (i + 1) - 90);
  const large = degPerSlice > 180 ? 1 : 0;
  const ox1 = round(CX + customR * Math.cos(a1)),
    oy1 = round(CY + customR * Math.sin(a1));
  const ox2 = round(CX + customR * Math.cos(a2)),
    oy2 = round(CY + customR * Math.sin(a2));
  const ix1 = round(CX + customInner * Math.cos(a1)),
    iy1 = round(CY + customInner * Math.sin(a1));
  const ix2 = round(CX + customInner * Math.cos(a2)),
    iy2 = round(CY + customInner * Math.sin(a2));
  return [
    `M ${ix1} ${iy1}`,
    `L ${ox1} ${oy1}`,
    `A ${customR} ${customR} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${customInner} ${customInner} 0 ${large} 0 ${ix1} ${iy1}`,
    "Z",
  ].join(" ");
}

const COLORS = [
  "#468189", // teal accent
  "#355f66", // teal dark
  "#9dbebb", // teal light
  "#8693ab", // lavender grey
  "#3e7cb1", // steel blue
  "#2d6a8f", // ocean blue
  "#5b8db8", // sky blue
  "#4a7c8e", // muted teal-blue
  "#6b8fa6", // slate blue
  "#3a6b7a", // deep teal
  "#7aabb8", // pale teal
  "#2e5f74", // ink teal
  "#5d7f99", // dusty blue
  "#4d8fa0", // medium teal
  "#7ba7bc", // powder teal
  "#325d72", // dark slate
  "#6a9eb5", // soft steel
  "#3b7a8c", // mid teal
  "#5e8a9a", // muted cyan
  "#2c5364", // deep navy teal
];

const SKELETON_COUNT = 20;
const SIZE = 480;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 10;
const INNER_R = 12;
const PTR_H = 28;
const PTR_W = 24;
const PTR_TIP_Y = CY - R;
const PTR_TRANS_Y = PTR_TIP_Y - PTR_H;

const toRad = (d: number) => d * (Math.PI / 180);

// Pure function — move outside component so it's never recreated

function getImgUrl(item: SpinnerItem): string | null {
  if (item.backdrop_path)
    return tmdbImage(item.backdrop_path, "w780");
  if (item.poster_path)
    return tmdbImage(item.poster_path, "w342");
  return null;
}

// Static component — never changes, no props that vary
const PointerEl = memo(({ faded = false }: { faded?: boolean }) => (
  <g transform={`translate(${CX}, ${PTR_TRANS_Y})`} opacity={faded ? 0.5 : 1}>
    {/* Enhanced multi-layer drop shadow */}
    <polygon
      points={`0,${PTR_H + 4} ${-PTR_W / 2 - 2},1 ${PTR_W / 2 + 2},1`}
      fill="url(#shadowGrad)"
      transform="translate(2,3)"
    />
    <polygon
      points={`0,${PTR_H + 2} ${-PTR_W / 2 - 1},0 ${PTR_W / 2 + 1},0`}
      fill="rgba(3,25,38,0.25)"
      transform="translate(1,2)"
    />
    
    {/* Main metallic body - gradient fill + double stroke */}
    <polygon
      points={`0,${PTR_H} ${-PTR_W / 2},0 ${PTR_W / 2},0`}
      fill={faded ? "rgba(70,129,137,0.4)" : "url(#metalGrad)"}
      className={!faded ? "dark:fill-[#468189]" : ""}
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1.5"
      strokeLinejoin="round"
      filter="url(#pointerGlow)"
    />
    {/* Inner stroke for depth */}
    <polygon
      points={`0,${PTR_H} ${-PTR_W / 2 + 1},1 ${PTR_W / 2 - 1},1`}
      fill="none"
      stroke="rgba(0,0,0,0.3)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    
    {/* Multi-layer highlights for 3D chrome effect */}
    <polygon
      points={`0,${PTR_H - 8} ${-PTR_W / 2 + 6},2 ${PTR_W / 2 - 6},2`}
      fill={faded ? "rgba(189,212,231,0.15)" : "url(#chromeGrad)"}
    />
    {/* Edge rim light */}
    <polygon
      points={`0,${PTR_H - 12} ${-PTR_W / 4},-2 ${PTR_W / 4},-2`}
      fill="rgba(255,255,255,0.4)"
      opacity={faded ? 0.5 : 1}
    />
    
    {/* Tip accent glow */}
    <polygon
      points={`0,${PTR_H - 3} ${-PTR_W / 6},0 ${PTR_W / 6},0`}
      fill="rgba(70,129,137,0.6)"
      filter="url(#tipGlow)"
    />
  </g>
));
PointerEl.displayName = "PointerEl";

// Memoized individual slice — only re-renders if its own data changes
const WheelSlice = memo(
  ({
    item,
    index,
    path,
    midDeg,
    midRad,
    url,
    label,
  }: {
    item: SpinnerItem | null;
    index: number;
    path: string;
    midDeg: number;
    midRad: number;
    url: string | null;
    label: string;
  }) => {
    const txtDist = R - 16;
    const tx = Math.round((CX + txtDist * Math.cos(midRad)) * 1000) / 1000;
    const ty = Math.round((CY + txtDist * Math.sin(midRad)) * 1000) / 1000;

    return (
      <g>
        <path
          d={path}
          fill={COLORS[index % COLORS.length]}
          opacity={item ? 1 : 0.35}
        />
        {url && (
          <image
            href={url}
            x={CX - R}
            y={CY - R}
            width={R * 2}
            height={R * 2}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#cp-${index})`}
          />
        )}
        {url && <path d={path} fill="rgba(0,0,0,0.28)" />}
        <path d={path} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
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
          transform={`rotate(${midDeg + 180}, ${tx}, ${ty})`}
        >
          {label}
        </text>
      </g>
    );
  },
);
WheelSlice.displayName = "WheelSlice";

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

  // All slice geometry computed once per slots.length change
  const sliceData = useMemo(() => {
    return slots.map((item, i) => {
      const path = buildSlicePath(i, degPerSlice);
      const midDeg = degPerSlice * i - 90 + degPerSlice / 2;
      const midRad = toRad(midDeg);
      const url = item ? getImgUrl(item) : null;
      const rawLabel = item?.title || item?.name || `Slot ${i + 1}`;
      const label =
        rawLabel.length > 16 ? rawLabel.slice(0, 15) + "…" : rawLabel;
      return { path, midDeg, midRad, url, label };
    });
  }, [slots, degPerSlice]);

  // Clip paths only need to change when slot count or geometry changes
  const clipPaths = useMemo(() => {
    return slots.map((_, i) => (
      <clipPath key={i} id={`cp-${i}`}>
        <path d={buildSlicePath(i, degPerSlice)} />
      </clipPath>
    ));
  }, [slots.length, degPerSlice]);

  // Skeleton slice geometry — only changes if SKELETON_COUNT changes (never)
  const skeletonData = useMemo(() => {
    const skeletonDeg = 360 / SKELETON_COUNT;
    return Array.from({ length: SKELETON_COUNT }, (_, i) => {
      const path = buildSlicePath(i, skeletonDeg);
      const midDeg = skeletonDeg * i - 90 + skeletonDeg / 2;
      const midRad = toRad(midDeg);
      const tx = Math.round((CX + (R - 20) * Math.cos(midRad)) * 1000) / 1000;
      const ty = Math.round((CY + (R - 20) * Math.sin(midRad)) * 1000) / 1000;
      const barW = 40 + (i % 3) * 12;
      return { path, midDeg, tx, ty, barW };
    });
  }, []);

  if (loading) {
    return (
      <div
        className="relative w-full max-w-120 mx-auto"
        style={{ aspectRatio: "1 / 1" }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
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

          {skeletonData.map(({ path, midDeg, tx, ty, barW }, i) => {
            const barH = 6;
            return (
              <g key={i}>
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
                <path
                  d={path}
                  fill="url(#shimmerLight)"
                  className="dark:hidden"
                />
                <path
                  d={path}
                  fill="url(#shimmerDark)"
                  className="hidden dark:block"
                />
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

          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            className="stroke-[rgba(0,0,0,0.12)] dark:stroke-[rgba(255,255,255,0.08)]"
            strokeWidth="5"
          />
          <PointerEl faded />
          <circle
            cx={CX}
            cy={CY}
            r={INNER_R}
            className="fill-[rgba(0,0,0,0.08)] dark:fill-[rgba(255,255,255,0.06)]"
            stroke="rgba(128,128,128,0.2)"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

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
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block", overflow: "visible" }}
        onContextMenu={(e) => {
          if (!onRemoveSlot || isSpinning) return;
          e.preventDefault();
          const rect = (
            e.currentTarget as SVGSVGElement
          ).getBoundingClientRect();
          const scaleX = SIZE / rect.width;
          const scaleY = SIZE / rect.height;
          const ox = (e.clientX - rect.left) * scaleX - CX;
          const oy = (e.clientY - rect.top) * scaleY - CY;
          const dist = Math.sqrt(ox * ox + oy * oy);
          if (dist < INNER_R || dist > R) return;
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
          
          {/* Pointer styling gradients & filters */}
          <linearGradient id="shadowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(3,25,38,0.6)"/>
            <stop offset="70%" stopColor="rgba(3,25,38,0.15)"/>
            <stop offset="100%" stopColor="transparent"/>
          </linearGradient>
          <linearGradient id="metalGrad" x1="0%" y1="100%" x2="30%" y2="0%">
            <stop offset="0%" stopColor="#355f66"/>
            <stop offset="50%" stopColor="#468189"/>
            <stop offset="100%" stopColor="#6b9da5"/>
          </linearGradient>
          <radialGradient id="chromeGrad" cx="30%" cy="20%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)"/>
            <stop offset="50%" stopColor="rgba(255,255,255,0.2)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
          
          <filter id="pointerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgba(70,129,137,0.4)"/>
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(70,129,137,0.2)"/>
          </filter>
          <filter id="tipGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#468189"/>
          </filter>
          
          {clipPaths}
        </defs>

        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)"
              : "none",
          }}
        >
          {sliceData.map(({ path, midDeg, midRad, url, label }, i) => (
            <WheelSlice
              key={i}
              item={slots[i]}
              index={i}
              path={path}
              midDeg={midDeg}
              midRad={midRad}
              url={url}
              label={label}
            />
          ))}

          <circle
            cx={CX}
            cy={CY}
            r={R}
            className="fill-[rgba(255,255,255,0.15)] dark:fill-[rgba(0,0,0,0)]"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            className="stroke-[rgba(0,0,0,0.5)] dark:stroke-[rgba(0,0,0,0.8)]"
            strokeWidth="6"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R + 4}
            fill="none"
            className="stroke-[rgba(0,0,0,0.15)] dark:stroke-[rgba(255,255,255,0.07)]"
            strokeWidth="2"
          />
        </g>

        <PointerEl />
        <circle
          cx={CX}
          cy={CY}
          r={11}
          className="fill-[rgba(0,0,0,0.55)] dark:fill-[rgba(255,255,255,0.08)]"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.5"
        />
        <circle cx={CX} cy={CY} r={4} fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>
  );
}
