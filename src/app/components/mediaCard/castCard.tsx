import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/imageTmdb";
import { Film } from "lucide-react";

export default function CastCard({
  actor,
  mediaType,
  showGradient = false,
  index = 0,
}: {
  actor: any;
  mediaType: string;
  showGradient?: boolean;
  index?: number;
}) {
  const actorName = actor.name || "Unknown Actor";

  const slug = actorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const characterName =
    actor.character && !["Self", "Himself", "Herself"].includes(actor.character)
      ? actor.character
      : actor.roles
          ?.map((r: any) => r.character)
          .filter(
            (c: string) => c && !["Self", "Himself", "Herself"].includes(c),
          )
          .join(", ");

  const delay = `${Math.min(index * 40, 320)}ms`;
  const href = `/person/${slug}/${actor.id}`;

  const badgeText = mediaType === "tv" ? "TV Cast" : "Movie Cast";

  return (
    <Link
      href={href}
      className="flex flex-col items-center text-center p-2 w-28 sm:w-32 shrink-0 opacity-0 animate-[fadeUp_0.4s_ease_forwards] group"
      style={{ animationDelay: delay }}
      role="listitem"
    >
      {/* IMAGE WRAPPER */}
      <div className="w-28 sm:w-32 h-40 sm:h-48 relative rounded-xl overflow-hidden bg-light-border dark:bg-dark-border">
        {actor.profile_path ? (
          <>
            <div className="relative w-full h-full">
              <Image
                src={tmdbImage(actor.profile_path, "w185")!}
                alt={actorName}
                fill
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 112px, 128px"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 pointer-events-none" />
            </div>

            {showGradient && actor.profile_path && (
              <div className="absolute inset-y-0 right-0 w-2/3 z-10 pointer-events-none bg-linear-to-l from-light-bg dark:from-dark-bg to-transparent" />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
            <Film className="w-5 h-5 text-light-disabled dark:text-dark-disabled" />

            <span className="text-xs font-medium leading-snug line-clamp-2 text-light-secondary-text dark:text-dark-secondary-text">
              {actorName}
            </span>

            <span className="text-[10px] uppercase tracking-widest text-light-disabled dark:text-dark-disabled">
              {badgeText}
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <p
        className="mt-2 font-semibold text-sm sm:text-base leading-snug truncate w-full text-light-body-text dark:text-dark-body-text transition-colors duration-200 group-hover:text-light-accent dark:group-hover:text-dark-accent"
        title={actorName}
      >
        {actorName}
      </p>

      {/* Role */}
      {characterName && (
        <p
          className="mt-0.5 text-xs sm:text-sm leading-tight truncate w-full"
          title={characterName}
        >
          {characterName}
        </p>
      )}

      {/* Episodes */}
      {mediaType === "tv" && actor.total_episode_count && (
        <p className="mt-0.5 text-xs text-light-body-text dark:text-dark-body-text">
          {actor.total_episode_count} eps
        </p>
      )}
    </Link>
  );
}
