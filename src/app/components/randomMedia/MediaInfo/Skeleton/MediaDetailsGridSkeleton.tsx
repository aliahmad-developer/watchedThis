export default function MediaDetailsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-5 content-start animate-pulse">
      {/* Original title — col-span-2 */}
      <div className="col-span-2">
        <div className="h-3.5 bg-light-border dark:bg-dark-border rounded w-20 mb-1.5" />
        <div className="h-5 bg-light-border dark:bg-dark-border rounded w-48" />
      </div>

      <SkeletonDetailItem labelWidth="w-24" valueWidth="w-28" />
      <SkeletonDetailItem labelWidth="w-10" valueWidth="w-12" />
      <SkeletonDetailItem labelWidth="w-16" valueWidth="w-20" />
      <SkeletonDetailItem labelWidth="w-14" valueWidth="w-18" />
      <SkeletonDetailItem labelWidth="w-12" valueWidth="w-10" />

      {/* Genres */}
      <div className="col-span-2">
        <div className="h-3.5 bg-light-border dark:bg-dark-border rounded w-14 mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <div className="w-16 h-6 bg-light-border dark:bg-dark-border rounded-full" />
          <div className="w-20 h-6 bg-light-border dark:bg-dark-border rounded-full" />
          <div className="w-14 h-6 bg-light-border dark:bg-dark-border rounded-full" />
          <div className="w-18 h-6 bg-light-border dark:bg-dark-border rounded-full" />
        </div>
      </div>

      {/* Production / Studio */}
      <div className="col-span-2">
        <div className="h-3.5 bg-light-border dark:bg-dark-border rounded w-20 mb-2" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-28" />
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-24" />
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-20" />
        </div>
      </div>
    </div>
  );
}

function SkeletonDetailItem({
  labelWidth = "w-16",
  valueWidth = "w-24",
}: {
  labelWidth?: string;
  valueWidth?: string;
}) {
  return (
    <div>
      <div
        className={`h-3.5 bg-light-border dark:bg-dark-border rounded ${labelWidth} mb-1.5`}
      />
      <div
        className={`h-5 bg-light-border dark:bg-dark-border rounded ${valueWidth}`}
      />
    </div>
  );
}
