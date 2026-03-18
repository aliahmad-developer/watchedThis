"use client";
import { useState } from "react";
import type { AmbientTextColors } from "../detailsPage";

interface OverviewProps {
  overview: string;
  textScheme: "light" | "dark";
  ambientText: AmbientTextColors;
  rawRgb?: string;
}

const SCROLL_THRESHOLD = 500;

function ExpandToggle({
  expanded,
  ambientText,
  onClick,
}: {
  expanded: boolean;
  ambientText: AmbientTextColors;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = hovered
    ? ambientText.primary.replace(/,[^,]+\)$/, ",1)")
    : ambientText.primary;

  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer inline ml-1 transition-all duration-200 font-medium"
      style={{
        color,
        textDecoration: hovered ? "underline" : "none",
        textUnderlineOffset: "3px",
      }}
    >
      {expanded ? " − less" : " + more"}
    </span>
  );
}

export default function OverviewSection({
  overview,
  textScheme,
  ambientText,
  rawRgb,
}: OverviewProps) {
  const isLong = overview.length > SCROLL_THRESHOLD;
  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 150;
  const shouldTruncate = !isLong && overview.length > MAX_CHARS;
  const truncated =
    shouldTruncate && !expanded ? overview.slice(0, MAX_CHARS) + "…" : overview;

  const overviewColor = ambientText.secondary.replace(/,[^,]+\)$/, ",0.9)");

  // Use raw dominant color for the highlight — it's vivid enough to register
  // whereas the processed ambientText values can be too dark/washed in dark mode.
  const glowRgb = rawRgb ?? (textScheme === "light" ? "20,20,20" : "255,255,255");
  const highlightBg = `rgba(${glowRgb},0.10)`;
  const highlightBorder = `rgba(${glowRgb},0.18)`;

  const overviewBoxClass = "rounded-lg px-3 py-2.5 transition-colors duration-700";
  const overviewBoxStyle = {
    background: highlightBg,
    border: `1px solid ${highlightBorder}`,
  };

  return (
    <div className="leading-relaxed transition-colors duration-700">
      {/* Mobile */}
      <div
        className={`md:hidden max-h-28 overflow-y-auto scrollbar-thin ${overviewBoxClass}`}
        style={overviewBoxStyle}
      >
        <p className="text-sm whitespace-pre-wrap" style={{ color: overviewColor }}>
          {overview}
        </p>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        {isLong ? (
          <div
            className={`overflow-y-auto scrollbar-thin ${overviewBoxClass}`}
            style={{ maxHeight: "8.5rem", ...overviewBoxStyle }}
          >
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: overviewColor }}
            >
              {overview}
            </p>
          </div>
        ) : (
          <div className={overviewBoxClass} style={overviewBoxStyle}>
            <p className="text-sm" style={{ color: overviewColor }}>
              {truncated}
              {shouldTruncate && (
                <ExpandToggle
                  expanded={expanded}
                  ambientText={ambientText}
                  onClick={() => setExpanded((v) => !v)}
                />
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}