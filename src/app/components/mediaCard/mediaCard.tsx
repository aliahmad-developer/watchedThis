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
  index?: number;
}

export default function MediaCard({ item, displayTitle, hideMetaData, index = 0 }: MediaCardProps) {
  const title = item.title || item.name || "Untitled";
  const mediaType = item.media_type || "movie";
  const duration =
    mediaType === "movie"
      ? item.runtime
      : item.episode_run_time?.[0] || item.runtime;

  const slug = createSlug(title);
  const href = `/${mediaType}/${slug}/${item.id}`;
  const handleClick = () => trackClick(item.id, mediaType as "movie" | "tv");

  const delay = `${Math.min(index * 40, 300)}ms`;

  return (
    <Link
      href={href}
      draggable
      onClick={handleClick}
      className="p-2 group cursor-pointer rounded-xl hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/50 transition-shadow duration-300 block opacity-0 animate-[fadeUp_0.4s_ease_forwards]"
      style={{ animationDelay: delay }}
    >
      {/* Poster */}
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl">
        <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.04]">
          <MediaPoster data={item} />
        </div>
        {/* Subtle shine on hover */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/0 group-hover:ring-white/10 transition-all duration-300 pointer-events-none" />
      </div>

      {/* Title */}
      <div className="mt-2 text-sm font-semibold text-center line-clamp-2 wrap-break-word transition-colors duration-200 group-hover:text-light-accent dark:group-hover:text-dark-accent">
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