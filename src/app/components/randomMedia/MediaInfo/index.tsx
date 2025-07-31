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
}

export default function MediaInfo({ data }: MediaInfoProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const displayTitle = data.title || data.name || "Untitled";
  const overview = data.overview || "No overview available.";
  const mediaType = data.media_type || "movie"; // Default to movie if not specified

  return (
    <div className="flex flex-col gap-8 text-light-body-text dark:text-dark-body-text">
      <TitleSection
        title={displayTitle}
        certification={data.certification}
        tagline={data.tagline}
      />
      <div className="flex flex-col lg:flex-row gap-10 w-full">
        <div className="flex-1 space-y-6">
          <ActionButtons
            mediaId={data.id}
            mediaType={mediaType}
            onPlayTrailer={() => setShowTrailer(true)}
          />
          <OverviewSection overview={overview} />
        </div>
        <div className="flex-1">
          <MediaDetailsGrid data={data} displayTitle={displayTitle} />
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
