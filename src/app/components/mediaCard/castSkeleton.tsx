export function CastCardSkeleton({ 
  showGradient = false 
}: { 
  showGradient?: boolean; 
}) {
  return (
    <div
      className="flex flex-col items-center text-center p-2 w-28 sm:w-32 flex-shrink-0 animate-pulse"
      role="listitem"
    >
      {/* Image Skeleton */}
      <div className="w-28 sm:w-32 h-40 sm:h-48 relative rounded-xl overflow-hidden bg-gray-300 dark:bg-gray-700">
        {showGradient && (
          <div className="absolute inset-y-0 right-0 w-2/3 z-10 pointer-events-none bg-gradient-to-l from-light-bg dark:from-dark-bg to-transparent" />
        )}
      </div>

      {/* Name Skeleton */}
      <div className="mt-2 w-full">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-auto"></div>
      </div>

      {/* Role Skeleton */}
      <div className="mt-0.5 w-full">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24 mx-auto mb-1"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20 mx-auto"></div>
      </div>

      {/* Episodes Skeleton (for TV shows) */}
      <div className="mt-0.5 w-full">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12 mx-auto"></div>
      </div>
    </div>
  );
}