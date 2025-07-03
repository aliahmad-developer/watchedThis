import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface MediaInfoProps {
  data: {
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    release_date?: string;
    first_air_date?: string;
    runtime?: number;
    number_of_seasons?: number;
    number_of_episodes?: number;
    status?: string;
    genres?: { name: string }[];
    production_companies?: { name: string }[];
    vote_average?: number;
    overview?: string;
    media_type?: string;
    tagline?: string;
    original_language?: string;
    origin_country?: string[];
    synonyms?: string[];
    premiered?: string;
    duration?: string;
    mal_score?: number;
  };
}

export default function MediaInfo({ data }: MediaInfoProps) {
  const [showFullOverview, setShowFullOverview] = useState(false);
  const displayTitle = data.title || data.name || "Untitled";
  const originalTitle = data.original_title || data.original_name || "Unknown";
  const releaseDate = data.release_date || data.first_air_date || "";
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";
  const isMovie = data.media_type === "movie";

  // Truncate overview if it's too long
  const maxOverviewLength = 130;
  const shouldTruncate =
    data.overview && data.overview.length > maxOverviewLength;
  const truncatedOverview =
    shouldTruncate && data?.overview
      ? data.overview.substring(0, maxOverviewLength) + "..."
      : data?.overview || "No overview available.";

  // Duration display logic based on media type
  const getDuration = () => {
    if (data.runtime) {
      const hours = Math.floor(data.runtime / 60);
      const minutes = data.runtime % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    if (!isMovie) {
      const seasons = data.number_of_seasons ?? 0;
      const episodes = data.number_of_episodes ?? 0;

      const seasonsText =
        seasons > 0 ? `${seasons} Season${seasons !== 1 ? "s" : ""}` : null;
      const episodesText =
        episodes > 0 ? `${episodes} Episode${episodes !== 1 ? "s" : ""}` : null;

      if (seasonsText && episodesText) return `${seasonsText}, ${episodesText}`;
      if (seasonsText) return seasonsText;
      if (episodesText) return episodesText;
    }

    return "Unknown";
  };

  const duration = getDuration();
  const score =
    data?.mal_score != null
      ? data.mal_score.toFixed(2)
      : data?.vote_average != null
      ? data.vote_average.toFixed(2)
      : null;

  return (
    <div className="flex flex-col gap-8 text-light-body-text dark:text-dark-body-text">
      {/* Title Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold p-1 text-light-bg dark:text-dark-header">
            {displayTitle}
          </h1>
        </div>
        <p className="text-lg text-light-secondary-text dark:text-dark-secondary-text">
          {data.tagline}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 w-full">
        {/* LEFT COLUMN: Title, Buttons, Overview */}
        <div className="flex-1 space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 bg-light-btn-bg dark:bg-dark-btn-bg hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg text-light-btn-text dark:text-dark-btn-text px-6 py-3 rounded-lg font-semibold transition">
              <FontAwesomeIcon icon={faPlay} />
              Watch Now
            </button>
            <button className="text-light-accent dark:text-dark-accent flex items-center gap-2 bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border px-6 py-3 rounded-lg font-semibold transition">
              Add to List
            </button>
          </div>

          {/* Overview */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-light-header dark:text-dark-header">
              Synopsis
            </h3>
            <div className="text-light-secondary-text dark:text-dark-secondary-text leading-relaxed">
              <p className="text-light-secondary-text dark:text-dark-secondary-text leading-relaxed">
                {showFullOverview ? data.overview : truncatedOverview}
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

        {/* RIGHT COLUMN: Metadata */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Others
                </h4>
                <p>{data.original_title || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Synonyms
                </h4>
                <p>{data.synonyms?.join(", ") || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Aired
                </h4>
                <p>{releaseDate || "N/A"}</p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Premiered
                </h4>
                <p>{year || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Duration
                </h4>
                <p>{duration}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Status
                </h4>
                <p>{data.status || "Finished Airing"}</p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Score
                </h4>
                <p>{score || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Genres
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.genres?.map((genre) => (
                    <span
                      key={genre.name}
                      className="text-light-accent dark:text-dark-accent bg-light-card dark:bg-dark-card px-3 py-1 rounded-full text-sm border border-light-border dark:border-dark-border"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Studio
                </h4>
                <p>{data.production_companies?.[0]?.name || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}