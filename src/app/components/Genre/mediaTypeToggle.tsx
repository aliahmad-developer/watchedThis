"use client";
interface GenreHeaderProps {
  genreName: string;
  mediaType: "movie" | "tv";
  onMediaTypeChange: (type: "movie" | "tv") => void;
}

export function GenreHeader({
  genreName,
  mediaType,
  onMediaTypeChange,
}: GenreHeaderProps) {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">
        {genreName
          ? `${genreName} ${mediaType === "movie" ? "Movies" : "TV Shows"}`
          : "Browse by Genre"}
      </h1>

      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => onMediaTypeChange("movie")}
          className={`px-6 py-2 rounded-full transition-colors ${
            mediaType === "movie"
              ? "bg-light-accent text-white dark:bg-dark-accent dark:text-dark-btn-text"
              : "bg-light-card hover:bg-light-disabled dark:bg-dark-card dark:hover:bg-dark-border text-black dark:text-white"
          }`}
        >
          Movies
        </button>
        <button
          onClick={() => onMediaTypeChange("tv")}
          className={`px-6 py-2 rounded-full transition-colors ${
            mediaType === "tv"
              ? "bg-light-accent text-white dark:bg-dark-accent dark:text-dark-btn-text"
              : "bg-light-card hover:bg-light-disabled dark:bg-dark-card dark:hover:bg-dark-border text-black dark:text-white"
          }`}
        >
          TV Shows
        </button>
      </div>
    </>
  );
}