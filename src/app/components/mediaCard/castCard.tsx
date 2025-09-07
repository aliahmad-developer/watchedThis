import Image from "next/image";
import Link from "next/link";
export default function CastCard({
  actor,
  mediaType,
  showGradient = false,
}: {
  actor: any;
  mediaType: string;
  showGradient?: boolean;
}) {
  const actorName = actor.name || "Unknown Actor";
  const characterName =
    actor.character && !["Self", "Himself", "Herself"].includes(actor.character)
      ? actor.character
      : actor.roles
          ?.map((r: any) => r.character)
          .filter(
            (c: string) => c && !["Self", "Himself", "Herself"].includes(c)
          )
          .join(", ");

  return (
    <div
      className="flex flex-col items-center text-center p-2 w-28 sm:w-32 flex-shrink-0"
      role="listitem"
    >
      {/* Image */}
      <div className="w-28 sm:w-32 h-40 sm:h-48 relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
        {actor.profile_path ? (
          <>
            <Link href={`/person/${actor.id}`}>
              <Image
                src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                alt={actorName}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 112px, 128px"
              />
            </Link>
            {showGradient && (
              <div className="absolute inset-y-0 right-0 w-2/3 z-10 pointer-events-none bg-gradient-to-l from-light-bg dark:from-dark-bg to-transparent" />
            )}
          </>
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">
            No Image
          </span>
        )}
      </div>

      {/* Name */}
      <p
        className="mt-2 font-semibold text-sm sm:text-base leading-snug truncate w-full text-light-body-text dark:text-dark-body-text"
        title={actorName}
      >
        {actorName}
      </p>

      {/* Role */}
      <p
        className="mt-0.5 text-xs sm:text-sm leading-tight text-gray-600 dark:text-gray-400 truncate w-full"
        title={characterName}
      >
        {characterName}
      </p>

      {/* Episodes */}
      {mediaType === "tv" && actor.total_episode_count && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
          {actor.total_episode_count} eps
        </p>
      )}
    </div>
  );
}
