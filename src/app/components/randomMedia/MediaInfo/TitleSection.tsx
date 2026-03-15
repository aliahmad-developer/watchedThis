import type { AmbientTextColors } from "../detailsPage";

interface TitleSectionProps {
  title: string;
  certification?: string;
  tagline?: string;
  ambientText: AmbientTextColors;
}

export default function TitleSection({
  title,
  certification,
  tagline,
  ambientText,
}: TitleSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {certification?.trim() && (
          <span
            className="border border-current bg-transparent inline-block px-2 py-1 rounded text-xs font-semibold transition-colors duration-700"
            style={{ color: ambientText.secondary, borderColor: ambientText.secondary }}
          >
            {certification}
          </span>
        )}
        <h1
          className="text-4xl font-bold p-1 transition-colors duration-700"
          style={{ color: ambientText.primary }}
        >
          {title}
        </h1>
      </div>
      {tagline?.trim() && (
        <p
          className="text-lg transition-colors duration-700"
          style={{ color: ambientText.secondary }}
        >
          {tagline}
        </p>
      )}
    </div>
  );
}