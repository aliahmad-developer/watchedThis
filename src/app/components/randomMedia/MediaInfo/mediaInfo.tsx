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
    poster_path?: string;
  };
  textScheme?: "light" | "dark";
}

export default function MediaInfo({
  data,
  textScheme = "light",
}: MediaInfoProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const displayTitle = data.title || data.name || "Untitled";
  const overview = data.overview || "No overview available.";
  const mediaType = data.media_type || "movie";

  const textClasses = {
    primary: textScheme === "light" ? "text-white" : "text-gray-900",
    secondary: textScheme === "light" ? "text-white/75" : "text-gray-700",
    body: textScheme === "light" ? "text-white/90" : "text-gray-800",
  };

  return (
    <div className={`flex flex-col gap-6 ${textClasses.body}`}>
      <TitleSection
        title={displayTitle}
        certification={data.certification}
        tagline={data.tagline}
        primaryClass={textClasses.primary}
        secondaryClass={textClasses.secondary}
      />

      {/* Two-column layout: left = actions + overview, right = details */}
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        {/* Left col */}
        <div className="flex-1 flex flex-col gap-5">
          <ActionButtons
            mediaId={data.id}
            mediaType={mediaType}
            title={displayTitle}
            poster_path={data.poster_path ?? ""}
            onPlayTrailer={() => setShowTrailer(true)}
          />
          <OverviewSection overview={overview} bodyClass={textClasses.body} />
        </div>

        {/* Right col */}
        <div className="lg:w-[42%] shrink-0">
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