import Link from "next/link";
import MediaPoster from "../randomMedia/mediaPoster";
import { trackClick } from "../Recommendation/behaviourTracker";
import { createSlug } from "../utilities/createSlug";

interface MediaCardProps {
  item: {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string;
    media_type?: string;
    runtime?: number;
    episode_run_time?: number[];
  };
  displayTitle?: string;
  hideMetaData?: boolean;
}

export default function MediaCard({ item, displayTitle, hideMetaData }: MediaCardProps) {
  const title = item.title || item.name || "Untitled";
  const mediaType = item.media_type || "movie";
  const duration =
    mediaType === "movie"
      ? item.runtime
      : item.episode_run_time?.[0] || item.runtime;

  const slug = createSlug(title);
  const href = `/${mediaType}/${slug}/${item.id}`;

  return (
    <Link
      href={href}
      draggable
      onClick={() => trackClick(item.id, mediaType === "tv" ? "tv" : "movie")}
      className="p-2 group cursor-pointer rounded-xl hover:shadow-md transition block"
    >
      {/* Poster */}
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl">
        <div className="absolute inset-0 transition-transform duration-200 group-hover:scale-[1.03] transform-gpu will-change-transform">
          <MediaPoster data={item}/>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 text-sm font-semibold text-center line-clamp-2 wrap-break-word">
        {title}
      </div>

      {/* Extra role/job if passed */}
      {displayTitle && (
        <div className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400 line-clamp-1">
          {displayTitle}
        </div>
      )}

      {/* Metadata */}
      {!hideMetaData && (
        <div className="mt-1 text-xs text-center text-light-accent dark:text-dark-accent flex justify-center gap-2">
          <span className="capitalize">{mediaType}</span>
          {duration ? <span>{duration} m</span> : null}
        </div>
      )}
    </Link>
  );
}