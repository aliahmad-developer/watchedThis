"use client";
import { useState } from "react";

interface OverviewProps {
  overview: string;
  bodyClass?: string;
}

export default function OverviewSection({
  overview,
  bodyClass = "text-white/90",
}: OverviewProps) {
  const [showFullOverview, setShowFullOverview] = useState(false);
  const maxOverviewLength = 133;
  const shouldTruncate = overview.length > maxOverviewLength;
  const truncatedOverview = shouldTruncate
    ? overview.substring(0, maxOverviewLength) + "..."
    : overview;

  // Derive a muted/accent class from the body class for the toggle button
  // e.g. "text-white/90" → "text-white/50", "text-gray-800" → "text-gray-500"
  const toggleClass = bodyClass.includes("white")
    ? "text-white/50 hover:text-white"
    : "text-gray-500 hover:text-gray-800";

  return (
    <div className="space-y-3">
      <div className={`leading-relaxed ${bodyClass}`}>
        {/* Mobile: scrollable fixed-height box */}
        <div className="md:hidden max-h-20 p-3 rounded-lg overflow-y-auto scrollbar-thin bg-white/10 dark:bg-black/10">
          <p className="text-sm whitespace-pre-wrap opacity-90">{overview}</p>
        </div>

        {/* Desktop: truncate with toggle */}
        <div className="hidden md:block">
          <p>
            {showFullOverview ? overview : truncatedOverview}
            {shouldTruncate && (
              <span
                onClick={() => setShowFullOverview(!showFullOverview)}
                className={`cursor-pointer inline ml-1 transition-colors ${toggleClass}`}
              >
                {showFullOverview ? " − less" : " + more"}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}