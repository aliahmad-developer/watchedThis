"use client";
import { useEffect, useState } from "react";
import Loading from '../components/utilities/loading'
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

export default function Random() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRandom() {
      try {
        const res = await fetch("/api/randomCall");
        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || "Fetch failed");
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRandom();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text">
        <Loading/>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text">
        <h1 className="text-xl sm:text-2xl md:text-3xl p-2">Error: {error}</h1>
      </div>
    );
  }

  const {
    title,
    name,
    original_title,
    original_name,
    release_date,
    first_air_date,
    runtime,
    number_of_seasons,
    number_of_episodes,
    status,
    genres,
    production_companies,
    vote_average,
    overview,
    poster_path,
    media_type,
    tagline,
    original_language,
    origin_country,
  } = data;

  const displayTitle = title || name || "Untitled";
  const originalTitle = original_title || original_name || "Unknown";
  const releaseDate = release_date || first_air_date || "";
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";
  const isMovie = media_type === "movie";

  const duration = isMovie
    ? runtime
      ? `${Math.floor(runtime / 60)}h ${runtime % 60}m`
      : "Unknown"
    : `${number_of_seasons || 0} Season(s), ${
        number_of_episodes || 0
      } Episodes`;

  const score = vote_average ? vote_average.toFixed(1) : null;
  const poster = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : "/placeholder.jpg";

  return (
    <div className="min-h-screen bg-gradient-to-b from-light-bg to-light-card dark:from-dark-header dark:via-dark-bg dark:to-dark-card text-light-body-text dark:text-dark-body-text">
      <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-light-border dark:border-dark-border">
          {/* Poster */}
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="relative w-52 sm:w-64 md:w-full max-w-xs aspect-[2/3] rounded-lg overflow-hidden shadow-md">
              <Image
                src={poster}
                alt={displayTitle}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 80vw, (max-width: 1024px) 40vw, 300px"
                priority
              />
            </div>
          </div>

          {/* Info */}
          <div className="md:w-2/3 flex flex-col justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 p-2 text-light-header dark:text-dark-body-text">
                {displayTitle}
              </h1>

              {tagline && (
                <p className="text-md sm:text-lg italic text-light-secondary-text dark:text-dark-secondary-text mb-4">
                  {tagline}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 text-sm mb-4">
                <span className="bg-light-nav dark:bg-dark-header px-3 py-1 rounded text-white dark:text-dark-btn-text dark:bg-white">
                  {duration}
                </span>
                <span className="bg-light-nav dark:bg-dark-header px-3 py-1 rounded text-white dark:text-dark-btn-text capitalize dark:bg-white">
                  {original_language || "Unknown"}
                </span>
                <span className="bg-light-nav dark:bg-dark-header px-3 py-1 rounded text-white dark:text-dark-btn-text dark:bg-white">
                  {origin_country?.[0] || "N/A"}
                </span>
                {year && (
                  <span className="bg-light-nav dark:bg-dark-header px-3 py-1 rounded text-white dark:text-dark-btn-text dark:bg-white">
                    {year}
                  </span>
                )}
              </div>

              {/* Overview */}
              <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm sm:text-base leading-relaxed">
                {overview || "No overview available."}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 mt-4">
              <button className="bg-light-btn-bg hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:hover:bg-dark-btn-hover-bg text-light-btn-text dark:text-dark-btn-text font-semibold px-6 py-2 rounded transition">
                <FontAwesomeIcon icon={faPlay} className="mr-2" />
                Watch Now
              </button>
              <button className="bg-light-disabled hover:bg-light-border dark:bg-dark-disabled dark:hover:bg-dark-border text-light-header dark:text-dark-body-text font-semibold px-6 py-2 rounded transition">
                + Add to List
              </button>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm">
              <div>
                <span className="block text-light-header dark:text-dark-accent font-semibold">
                  Original Title
                </span>
                <p className="text-light-secondary-text dark:text-dark-secondary-text">
                  {originalTitle}
                </p>
              </div>
              <div>
                <span className="block text-light-header dark:text-dark-accent font-semibold">
                  Release Date
                </span>
                <p className="text-light-secondary-text dark:text-dark-secondary-text">
                  {releaseDate || "Unknown"}
                </p>
              </div>
              <div>
                <span className="block text-light-header dark:text-dark-accent font-semibold">
                  Genres
                </span>
                <p className="text-light-secondary-text dark:text-dark-secondary-text">
                  {genres?.map((g: any) => g.name).join(", ") || "Unknown"}
                </p>
              </div>
              <div>
                <span className="block text-light-header dark:text-dark-accent font-semibold">
                  Status
                </span>
                <p className="text-light-secondary-text dark:text-dark-secondary-text">
                  {status || "Unknown"}
                </p>
              </div>
              <div>
                <span className="block text-light-header dark:text-dark-accent font-semibold">
                  Score
                </span>
                <p className="text-light-secondary-text dark:text-dark-secondary-text">
                  {score ? `${score}/10` : "Not Rated"}
                </p>
              </div>
              <div>
                <span className="block text-light-header dark:text-dark-accent font-semibold">
                  Studio
                </span>
                <p className="text-light-secondary-text dark:text-dark-secondary-text">
                  {production_companies?.[0]?.name || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="p-100"></div>
    </div>
  );
}
