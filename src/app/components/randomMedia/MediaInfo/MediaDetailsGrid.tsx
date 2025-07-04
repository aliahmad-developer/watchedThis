import { DetailItem } from "./DetailItem";
import { GenreTags } from "./GenreTags";
import { ProductionList } from "./ProductionList";

interface MediaDetailsGridProps {
  data: any;
  displayTitle: string;
}

export default function MediaDetailsGrid({ data, displayTitle }: MediaDetailsGridProps) {
  const isMovie = data.media_type === "movie";
  const originalTitle = data.original_title || data.original_name || "";
  const releaseDate = data.release_date || data.first_air_date || data.premiered || "";
  const year = releaseDate ? new Date(releaseDate).getFullYear().toString() : "N/A";

  const getDuration = () => {
    if (data.runtime) {
      const hours = Math.floor(data.runtime / 60);
      const minutes = data.runtime % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    if (data.episode_run_time?.length) {
      const avgRuntime = Math.round(
        data.episode_run_time.reduce((a: number, b: number) => a + b, 0) / data.episode_run_time.length
      );
      return `${avgRuntime}m per episode`;
    }
    if (!isMovie) {
      const parts = [];
      if (data.number_of_seasons) parts.push(`${data.number_of_seasons} Season${data.number_of_seasons !== 1 ? "s" : ""}`);
      if (data.number_of_episodes) parts.push(`${data.number_of_episodes} Episode${data.number_of_episodes !== 1 ? "s" : ""}`);
      return parts.length ? parts.join(", ") : "N/A";
    }
    return "Unknown";
  };

  const getScore = () => {
    if (data.mal_score != null) return data.mal_score.toFixed(2);
    if (data.vote_average != null) return data.vote_average.toFixed(2);
    return "N/A";
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
    return map[data.status] || data.status || "N/A";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <DetailItem
          label="Original Title"
          value={originalTitle?.trim() && originalTitle !== displayTitle ? originalTitle : "N/A"}
        />
        <DetailItem
          label={isMovie ? "Release Date" : "First Aired"}
          value={releaseDate || "N/A"}
        />
      </div>

      <div className="space-y-6">
        <DetailItem label="Year" value={year} />
        <DetailItem label="Duration" value={getDuration()} />
        <DetailItem label="Status" value={getStatus()} />
      </div>

      <div className="space-y-6">
        <DetailItem label="Score" value={getScore()} />
        <div>
          <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">Genres</h4>
          <GenreTags genres={data.genres} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
            {isMovie ? "Production" : "Studio"}
          </h4>
          <ProductionList companies={data.production_companies} />
        </div>
      </div>
    </div>
  );
}