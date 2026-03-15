"use client";
import { useState } from "react";
import type { AmbientTextColors } from "../detailsPage";

interface OverviewProps {
  overview: string;
  textScheme: "light" | "dark";
  ambientText: AmbientTextColors;
}

const SCROLL_THRESHOLD = 500;

export default function OverviewSection({ overview, textScheme, ambientText }: OverviewProps) {
  const isLong = overview.length > SCROLL_THRESHOLD;
  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 150;
  const shouldTruncate = !isLong && overview.length > MAX_CHARS;
  const truncated =
    shouldTruncate && !expanded ? overview.slice(0, MAX_CHARS) + "…" : overview;

  // Scroll box scrim — dark for light text on dark bg, light for dark text on bright bg
  const scrollBoxBg =
    textScheme === "light" ? "bg-black/30 backdrop-blur-sm" : "bg-white/40 backdrop-blur-sm";

  return (
    <div className="leading-relaxed transition-colors duration-700" style={{ color: ambientText.primary }}>
      {/* Mobile: always scrollable */}
      <div className={`md:hidden max-h-24 overflow-y-auto rounded-lg px-3 py-2 ${scrollBoxBg} scrollbar-thin`}>
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
              <span
                onClick={() => setExpanded((v) => !v)}
                className="cursor-pointer inline ml-1 transition-colors duration-700 hover:opacity-100"
                style={{ color: ambientText.muted }}
              >
                {expanded ? " − less" : " + more"}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}