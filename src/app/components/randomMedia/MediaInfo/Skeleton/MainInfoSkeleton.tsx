import MediaDetailsGridSkeleton from "./MediaDetailsGridSkeleton";
export default function MediaInfoSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Title Section Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-6 bg-light-border dark:bg-dark-border rounded"></div>
          <div className="h-10 bg-light-border dark:bg-dark-border rounded w-3/4"></div>
        </div>
        <div className="h-5 bg-light-border dark:bg-dark-border rounded w-1/2"></div>
      </div>

      {/* Content Layout */}
      <div className="flex flex-col lg:flex-row gap-10 w-full">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          {/* Action Buttons Skeleton */}
          <div className="flex flex-wrap gap-4">
            <div className="w-32 h-10 bg-light-border dark:bg-dark-border rounded-full"></div>
            <div className="w-32 h-10 bg-light-border dark:bg-dark-border rounded-full"></div>
          </div>

          {/* Overview Section Skeleton */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="h-4 bg-light-border dark:bg-dark-border rounded w-full"></div>
              <div className="h-4 bg-light-border dark:bg-dark-border rounded w-full"></div>
              <div className="h-4 bg-light-border dark:bg-dark-border rounded w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Right Column - Media Details Grid Skeleton */}
        <div className="flex-1">
          <MediaDetailsGridSkeleton />
        </div>
      </div>
    </div>
  );
}