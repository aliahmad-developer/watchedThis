// components/skeleton/MediaDetailsGridSkeleton.tsx
export default function MediaDetailsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      {/* First Column */}
      <div className="space-y-6">
        <SkeletonDetailItem />
        <SkeletonDetailItem />
      </div>

      {/* Second Column */}
      <div className="space-y-6">
        <SkeletonDetailItem />
        <SkeletonDetailItem />
        <SkeletonDetailItem />
      </div>

      {/* Third Column */}
      <div className="space-y-6">
        <SkeletonDetailItem />
        
        {/* Genres Skeleton */}
        <div>
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-16 mb-2"></div>
          <div className="flex flex-wrap gap-2">
            <div className="w-16 h-6 bg-light-border dark:bg-dark-border rounded-full"></div>
            <div className="w-20 h-6 bg-light-border dark:bg-dark-border rounded-full"></div>
            <div className="w-14 h-6 bg-light-border dark:bg-dark-border rounded-full"></div>
          </div>
        </div>

        {/* Production Companies Skeleton */}
        <div>
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-20 mb-2"></div>
          <div className="grid grid-cols-2 gap-y-1 gap-x-4">
            <div className="h-4 bg-light-border dark:bg-dark-border rounded"></div>
            <div className="h-4 bg-light-border dark:bg-dark-border rounded"></div>
            <div className="h-4 bg-light-border dark:bg-dark-border rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonDetailItem() {
  return (
    <div>
      <div className="h-4 bg-light-border dark:bg-dark-border rounded w-16 mb-1"></div>
      <div className="h-5 bg-light-border dark:bg-dark-border rounded w-24"></div>
    </div>
  );
}