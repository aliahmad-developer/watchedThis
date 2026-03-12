import MediaDetailsGridSkeleton from "./MediaDetailsGridSkeleton";

export default function MediaInfoSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-6 bg-light-border dark:bg-dark-border rounded" />
          <div className="h-10 bg-light-border dark:bg-dark-border rounded w-3/4" />
        </div>
        <div className="h-5 bg-light-border dark:bg-dark-border rounded w-1/2" />
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        {/* Left col: actions + overview */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <div className="w-32 h-10 bg-light-border dark:bg-dark-border rounded-full" />
            <div className="w-32 h-10 bg-light-border dark:bg-dark-border rounded-full" />
          </div>

          {/* Overview */}
          <div className="space-y-2">
            <div className="h-4 bg-light-border dark:bg-dark-border rounded w-full" />
            <div className="h-4 bg-light-border dark:bg-dark-border rounded w-full" />
            <div className="h-4 bg-light-border dark:bg-dark-border rounded w-3/4" />
          </div>
        </div>

        {/* Right col: details */}
        <div className="lg:w-[42%] shrink-0">
          <MediaDetailsGridSkeleton />
        </div>
      </div>
    </div>
  );
}