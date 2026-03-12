"use client";
import { useState } from "react";

interface OverviewProps {
  overview: string;
  bodyClass?: string;
}

const SCROLL_THRESHOLD = 500;

export default function OverviewSection({
  overview,
  bodyClass = "text-white/90",
}: OverviewProps) {
  const isLong = overview.length > SCROLL_THRESHOLD;

  // Only used when NOT long (truncate/expand path)
  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 150;
  const shouldTruncate = !isLong && overview.length > MAX_CHARS;
  const truncated = shouldTruncate && !expanded
    ? overview.slice(0, MAX_CHARS) + "…"
    : overview;

  const toggleClass = bodyClass.includes("white")
    ? "text-white/50 hover:text-white"
    : "text-gray-500 hover:text-gray-800";

  return (
    <div className={`leading-relaxed ${bodyClass}`}>
      {/* Mobile: always scrollable */}
      <div className="md:hidden max-h-24 overflow-y-auto rounded-lg px-3 py-2 bg-white/10 dark:bg-black/10 scrollbar-thin">
        <p className="text-sm whitespace-pre-wrap opacity-90">{overview}</p>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        {isLong ? (
          // Long overview → fixed-height scrollable box, no truncation
          <div
            className="overflow-y-auto rounded-lg px-3 py-2.5 bg-white/10 dark:bg-black/10 scrollbar-thin"
            style={{ maxHeight: "7.5rem" }} // ~4 lines
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{overview}</p>
          </div>
        ) : (
          // Short/medium overview → inline text with optional expand
          <p>
            {truncated}
            {shouldTruncate && (
              <span
                onClick={() => setExpanded((v) => !v)}
                className={`cursor-pointer inline ml-1 transition-colors ${toggleClass}`}
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