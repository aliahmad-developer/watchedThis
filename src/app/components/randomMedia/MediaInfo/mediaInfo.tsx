import { useState } from "react";
import TitleSection from "./TitleSection";
import ActionButtons from "./ActionButtons";
import OverviewSection from "./OverviewSection";
import MediaDetailsGrid from "./MediaDetailsGrid";
import TrailerModal from "../../playTrailerModal/trailerModal";
import type { AmbientTextColors } from "../detailsPage";

interface MediaInfoProps {
  data: {
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    certification?: string;
    tagline?: string;
    media_type?: "movie" | "tv";
    poster_path?: string;
    genre_ids?: number[];
    genres?: { id: number; name: string }[]; 
  };
  textScheme?: "light" | "dark";
  ambientText: AmbientTextColors;
  rawRgb?: string;
}

export default function MediaInfo({
  data,
  textScheme = "light",
  ambientText,
  rawRgb,
}: MediaInfoProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const displayTitle = data.title || data.name || "Untitled";
  const overview = data.overview || "No overview available.";
  const mediaType = data.media_type || "movie";

  const resolvedGenreIds =
    data.genre_ids ?? data.genres?.map((g) => g.id) ?? [];

  return (
    <div className="flex flex-col gap-6" style={{ color: ambientText.primary }}>
      <TitleSection
        title={displayTitle}
        certification={data.certification}
        tagline={data.tagline}
        ambientText={ambientText}
      />

      {/* Two-column layout: left = actions + overview, right = details */}
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        {/* Left col */}
        <div className="flex-1 flex flex-col gap-5">
          <ActionButtons
            mediaId={data.id}
            mediaType={mediaType}
            title={displayTitle}
            genre_ids={resolvedGenreIds}
            poster_path={data.poster_path ?? ""}
            onPlayTrailer={() => setShowTrailer(true)}
          />
          <OverviewSection
            overview={overview}
            textScheme={textScheme}
            ambientText={ambientText}
            rawRgb={rawRgb}
          />
        </div>

        {/* Right col */}
        <div className="lg:w-[42%] shrink-0">
          <MediaDetailsGrid
            data={data}
            displayTitle={displayTitle}
            ambientText={ambientText}
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
