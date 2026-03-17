"use client";
import { useState } from "react";
import type { AmbientTextColors } from "../detailsPage";

interface OverviewProps {
  overview: string;
  textScheme: "light" | "dark";
  ambientText: AmbientTextColors;
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

export default function OverviewSection({ overview, textScheme, ambientText }: OverviewProps) {
  const isLong = overview.length > SCROLL_THRESHOLD;
  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 150;
  const shouldTruncate = !isLong && overview.length > MAX_CHARS;
  const truncated =
    shouldTruncate && !expanded ? overview.slice(0, MAX_CHARS) + "…" : overview;

  // Nudge secondary's alpha down slightly for that softer prose feel —
  // but only touch opacity, keep the same hue as the rest of the ambient system
  // so it harmonizes whether the safety net fired or not.
  const overviewColor = ambientText.secondary.replace(/,[^,]+\)$/, ",0.82)");

  const scrollBoxBg =
    textScheme === "light" ? "bg-black/30 backdrop-blur-sm" : "bg-white/40 backdrop-blur-sm";

  return (
    <div
      className="leading-relaxed transition-colors duration-700"
      style={{ color: overviewColor }}
    >
      {/* Mobile: always scrollable */}
      <div
        className={`md:hidden max-h-24 overflow-y-auto rounded-lg px-3 py-2 ${scrollBoxBg} scrollbar-thin`}
      >
        <p className="text-sm whitespace-pre-wrap">{overview}</p>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        {isLong ? (
          <div
            className={`overflow-y-auto rounded-lg px-3 py-2.5 ${scrollBoxBg} scrollbar-thin`}
            style={{ maxHeight: "7.5rem" }}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{overview}</p>
          </div>
        ) : (
          <p>
            {truncated}
            {shouldTruncate && (
              <ExpandToggle
                expanded={expanded}
                ambientText={ambientText}
                onClick={() => setExpanded((v) => !v)}
              />
            )}
          </p>
        )}
      </div>
    </div>
  );
}