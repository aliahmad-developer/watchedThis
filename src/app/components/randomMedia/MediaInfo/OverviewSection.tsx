import { useState } from "react";

interface OverviewProps {
  overview: string;
  backgroundColor?: string;
}

export default function OverviewSection({ overview, backgroundColor }: OverviewProps) {
  const [showFullOverview, setShowFullOverview] = useState(false);
  const maxOverviewLength = 133;
  const shouldTruncate = overview.length > maxOverviewLength;
  const truncatedOverview = shouldTruncate ? overview.substring(0, maxOverviewLength) + "..." : overview;

  // Function to determine text color based on background brightness
  const getTextColor = (bgColor: string) => {
    // Simple brightness calculation - you might want a more sophisticated approach
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className="space-y-3">
      <div className="leading-relaxed">
        <div 
          className="md:hidden max-h-20 p-3 rounded-lg overflow-y-auto scrollbar-thin"
          style={{ 
            backgroundColor: backgroundColor || 'var(--ambient-card, rgba(255, 255, 255, 0.1))',
            color: backgroundColor ? getTextColor(backgroundColor) : 'inherit'
          }}
        >
          <p className="text-sm whitespace-pre-wrap opacity-90">{overview}</p>
        </div>
        <div className="hidden md:block">
          <p style={{ color: backgroundColor ? getTextColor(backgroundColor) : 'inherit' }}>
            {showFullOverview ? overview : truncatedOverview}
            {shouldTruncate && (
              <span
                onClick={() => setShowFullOverview(!showFullOverview)}
                className="cursor-pointer inline ml-1 transition-colors"
                style={{ 
                  color: backgroundColor 
                    ? getTextColor(backgroundColor) 
                    : 'var(--ambient-accent,light-accent dar)',
                  opacity: 0.8
                }}
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