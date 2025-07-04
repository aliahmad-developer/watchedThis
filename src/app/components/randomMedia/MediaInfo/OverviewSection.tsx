import { useState } from "react";

interface OverviewProps {
  overview: string;
}

export default function OverviewSection({ overview }: OverviewProps) {
  const [showFullOverview, setShowFullOverview] = useState(false);
  const maxOverviewLength = 130;
  const shouldTruncate = overview.length > maxOverviewLength;
  const truncatedOverview = shouldTruncate ? overview.substring(0, maxOverviewLength) + "..." : overview;

  return (
    <div className="space-y-3">
      <div className="text-light-secondary-text dark:text-dark-secondary-text leading-relaxed">
        <div className="md:hidden max-h-20 p-3 bg-light-card/20 dark:bg-dark-card/0 rounded-lg overflow-y-auto scrollbar-thin">
          <p className="text-sm whitespace-pre-wrap opacity-90">{overview}</p>
        </div>
        <div className="hidden md:block">
          <p>
            {showFullOverview ? overview : truncatedOverview}
            {shouldTruncate && (
              <span
                onClick={() => setShowFullOverview(!showFullOverview)}
                className="cursor-pointer inline ml-1 text-light-accent dark:text-dark-accent"
              >
                {showFullOverview ? " - less" : " + More"}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
