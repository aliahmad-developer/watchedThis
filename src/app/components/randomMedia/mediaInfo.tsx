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
    episode_run_time?: number[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    status?: string;
    genres?: { name: string }[];
    production_companies?: { name: string | null }[];
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

  // Title logic
  const displayTitle = data.title || data.name || "Untitled";
  const originalTitle = data.original_title || data.original_name || null;
  const hasDifferentOriginalTitle = originalTitle && originalTitle !== displayTitle;

  // Date logic
  const releaseDate = data.release_date || data.first_air_date || data.premiered || "";
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const isMovie = data.media_type === "movie";

  // Overview logic
  const maxOverviewLength = 130;
  const overview = data.overview || "No overview available.";
  const shouldTruncate = overview.length > maxOverviewLength;
  const truncatedOverview = shouldTruncate
    ? overview.substring(0, maxOverviewLength) + "..."
    : overview;

  // Duration logic
  const getDuration = () => {
    // Handle movie runtime
    if (data.runtime) {
      const hours = Math.floor(data.runtime / 60);
      const minutes = data.runtime % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // Handle TV episode runtime (average if array is provided)
    if (data.episode_run_time?.length) {
      const avgRuntime = Math.round(
        data.episode_run_time.reduce((a, b) => a + b, 0) / data.episode_run_time.length
      );
      return `${avgRuntime}m per episode`;
    }

    // Handle TV show seasons/episodes
    if (!isMovie) {
      const parts = [];
      if (data.number_of_seasons) {
        parts.push(`${data.number_of_seasons} Season${data.number_of_seasons !== 1 ? "s" : ""}`);
      }
      if (data.number_of_episodes) {
        parts.push(`${data.number_of_episodes} Episode${data.number_of_episodes !== 1 ? "s" : ""}`);
      }
      return parts.length ? parts.join(", ") : null;
    }

    return null;
  };

  const duration = getDuration() || "Unknown";

  // Score logic
  const getScore = () => {
    if (data?.mal_score != null) return data.mal_score.toFixed(2);
    if (data?.vote_average != null) return data.vote_average.toFixed(2);
    return "N/A";
  };
  const score = getScore();

  // Studios logic
  const studios = data.production_companies
    ?.map((c) => c.name)
    .filter(Boolean)
    .join(", ") || "N/A";

  // Status logic
  const getStatus = () => {
    if (!data.status) return "N/A";
    
    const statusMap: Record<string, string> = {
      "Released": "Released",
      "Returning Series": "Ongoing",
      "Ended": "Completed",
      "Canceled": "Cancelled",
      "In Production": "In Production",
      "Planned": "Planned",
      "Post Production": "Post Production"
    };
    
    return statusMap[data.status] || data.status;
  };
  const status = getStatus();

  // Genres logic
  const genres = data.genres?.map(g => g.name).join(", ") || "N/A";

  return (
    <div className="flex flex-col gap-8 text-light-body-text dark:text-dark-body-text">
      {/* Title Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold p-1 text-light-bg dark:text-dark-header">
            {displayTitle}
          </h1>
        </div>
        {data.tagline && (
          <p className="text-lg text-light-secondary-text dark:text-dark-secondary-text">
            {data.tagline}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-10 w-full">
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-6">
          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 bg-light-btn-bg dark:bg-dark-btn-bg hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg text-light-btn-text dark:text-dark-btn-text px-6 py-3 rounded-lg font-semibold transition">
              <FontAwesomeIcon icon={faPlay} />
              Watch Now
            </button>
            <button className="text-light-accent flex items-center gap-2 bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border px-6 py-3 rounded-lg font-semibold transition">
              Add to List
            </button>
          </div>

          {/* Overview */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-light-header dark:text-dark-header">
              Synopsis
            </h3>
            <div className="text-light-secondary-text dark:text-dark-secondary-text leading-relaxed">
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

        {/* RIGHT COLUMN */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-6">
              {hasDifferentOriginalTitle && (
                <div>
                  <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                    Original Title
                  </h4>
                  <p>{originalTitle}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Synonyms
                </h4>
                <p>{data.synonyms?.length ? data.synonyms.join(", ") : "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  {isMovie ? "Release Date" : "First Aired"}
                </h4>
                <p>{releaseDate || "N/A"}</p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
              {year && (
                <div>
                  <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                    Year
                  </h4>
                  <p>{year}</p>
                </div>
              )}
              {duration && (
                <div>
                  <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                    Duration
                  </h4>
                  <p>{duration}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Status
                </h4>
                <p>{status}</p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Score
                </h4>
                <p>{score}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  Genres
                </h4>
                <div className="flex flex-wrap mt-1 mb-1 gap-2">
                  {data.genres?.length ? (
                    data.genres.map((genre) => (
                      <span
                        key={genre.name}
                        className="text-light-accent dark:text-dark-accent bg-light-card dark:bg-dark-card px-3 py-1 rounded-full text-sm border border-light-border dark:border-dark-border"
                      >
                        {genre.name}
                      </span>
                    ))
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">
                  {isMovie ? "Production" : "Studio"}
                </h4>
                <p>{studios}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}