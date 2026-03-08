import { useState } from "react";
import TitleSection from "./TitleSection";
import ActionButtons from "./ActionButtons";
import OverviewSection from "./OverviewSection";
import MediaDetailsGrid from "./MediaDetailsGrid";
import TrailerModal from "../../playTrailerModal/trailerModal";

interface MediaInfoProps {
  data: {
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    certification?: string;
    tagline?: string;
    media_type?: "movie" | "tv";
  };
  textScheme?: "light" | "dark";
}

export default function MediaInfo({ data, textScheme = "light" }: MediaInfoProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const displayTitle = data.title || data.name || "Untitled";
  const overview = data.overview || "No overview available.";
  const mediaType = data.media_type || "movie";

  // Text classes derived from backdrop luminance, not site theme.
  // This ensures readability regardless of what image TMDB returns.
  const textClasses = {
    // Primary text — titles, main content
    primary: textScheme === "light" ? "text-white" : "text-gray-900",
    // Secondary text — taglines, labels, muted info
    secondary: textScheme === "light" ? "text-white/75" : "text-gray-700",
    // Body text — overview paragraph
    body: textScheme === "light" ? "text-white/90" : "text-gray-800",
  };

  return (
    <div className={`flex flex-col gap-8 ${textClasses.body}`}>
      <TitleSection
        title={displayTitle}
        certification={data.certification}
        tagline={data.tagline}
        primaryClass={textClasses.primary}
        secondaryClass={textClasses.secondary}
      />
      <div className="flex flex-col lg:flex-row gap-10 w-full">
        <div className="flex-1 space-y-6">
          <ActionButtons
            mediaId={data.id}
            mediaType={mediaType}
            onPlayTrailer={() => setShowTrailer(true)}
          />
          <OverviewSection
            overview={overview}
            bodyClass={textClasses.body}
          />
        </div>
        <div className="flex-1">
          <MediaDetailsGrid
            data={data}
            displayTitle={displayTitle}
            primaryClass={textClasses.primary}
            secondaryClass={textClasses.secondary}
          />
        </div>
      </div>

      {showTrailer && (
        <TrailerModal
          mediaId={data.id}
          mediaType={mediaType}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
}