import { DetailItem } from "./DetailItem";
import GenreTags from "./GenreTags";
import { ProductionList } from "./ProductionList";

interface MediaDetailsGridProps {
  data: any;
  displayTitle: string;
}

export default function MediaDetailsGrid({ data, displayTitle }: MediaDetailsGridProps) {
  const isMovie = data.media_type === "movie";
  const originalTitle = data.original_title || data.original_name || "";
  const releaseDate = data.release_date || data.first_air_date || data.premiered || "";
  const year = releaseDate ? new Date(releaseDate).getFullYear().toString() : "";
  const genres = data.genres || [];
  const companies = data.production_companies || [];

  const getDuration = () => {
    if (data.runtime) {
      const hours = Math.floor(data.runtime / 60);
      const minutes = data.runtime % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    if (Array.isArray(data.episode_run_time) && data.episode_run_time.length) {
      const avgRuntime = Math.round(
        data.episode_run_time.reduce((a: number, b: number) => a + b, 0) / data.episode_run_time.length
      );
      return `${avgRuntime}m per episode`;
    }
    if (!isMovie) {
      const parts = [];
      if (data.number_of_seasons) parts.push(`${data.number_of_seasons} Season${data.number_of_seasons !== 1 ? "s" : ""}`);
      if (data.number_of_episodes) parts.push(`${data.number_of_episodes} Episode${data.number_of_episodes !== 1 ? "s" : ""}`);
      return parts.length ? parts.join(", ") : "";
    }
    return "";
  };

  const getScore = () => {
    if (typeof data.mal_score === "number") return data.mal_score.toFixed(2);
    if (typeof data.vote_average === "number") return data.vote_average.toFixed(2);
    return "";
  };

  const getStatus = () => {
    const map: Record<string, string> = {
      Released: "Released",
      "Returning Series": "Ongoing",
      Ended: "Completed",
      Canceled: "Cancelled",
      "In Production": "In Production",
      Planned: "Planned",
      "Post Production": "Post Production",
    };
    return map[data.status] || data.status || "";
  };

  const shouldShowOriginalTitle =
    originalTitle.trim() &&
    originalTitle !== displayTitle;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        {shouldShowOriginalTitle && (
          <DetailItem label="Original Title" value={originalTitle} />
        )}
        {releaseDate && (
          <DetailItem label={isMovie ? "Release Date" : "First Aired"} value={releaseDate} />
        )}
      </div>

      <div className="space-y-6">
        {year && <DetailItem label="Year" value={year} />}
        {getDuration() && <DetailItem label="Duration" value={getDuration()} />}
        {getStatus() && <DetailItem label="Status" value={getStatus()} />}
      </div>

      <div className="space-y-6">
        {getScore() && <DetailItem label="Score" value={getScore()} />}

        {genres.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
              Genres
            </h4>
            <GenreTags genres={genres} />
          </div>
        )}

        {companies.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
              {isMovie ? "Production" : "Studio"}
            </h4>
            <ProductionList companies={companies} />
          </div>
        )}
      </div>
    </div>
  );
}
