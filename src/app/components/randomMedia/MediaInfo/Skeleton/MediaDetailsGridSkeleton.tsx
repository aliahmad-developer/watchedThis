export default function MediaDetailsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-5 content-start animate-pulse">
      {/* Scalar fields — pairs filling two columns */}
      <SkeletonDetailItem />
      <SkeletonDetailItem />
      <SkeletonDetailItem />
      <SkeletonDetailItem />
      <SkeletonDetailItem />
      <SkeletonDetailItem />

      {/* Genres — col-span-2 */}
      <div className="col-span-2">
        <div className="h-3.5 bg-light-border dark:bg-dark-border rounded w-14 mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <div className="w-16 h-6 bg-light-border dark:bg-dark-border rounded-full" />
          <div className="w-20 h-6 bg-light-border dark:bg-dark-border rounded-full" />
          <div className="w-14 h-6 bg-light-border dark:bg-dark-border rounded-full" />
        </div>
      </div>

      {/* Studio — col-span-2 */}
      <div className="col-span-2">
        <div className="h-3.5 bg-light-border dark:bg-dark-border rounded w-14 mb-2" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-28" />
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-24" />
        </div>
      </div>

      {/* Keywords — col-span-2 */}
      <div className="col-span-2">
        <div className="h-3.5 bg-light-border dark:bg-dark-border rounded w-16 mb-2" />
        <div className="flex flex-wrap gap-1.5">
          {[40, 56, 48, 64, 44, 52].map((w, i) => (
            <div
              key={i}
              className="h-4 bg-light-border dark:bg-dark-border rounded"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonDetailItem() {
  return (
    <div>
      <div className="h-3.5 bg-light-border dark:bg-dark-border rounded w-16 mb-1.5" />
      <div className="h-5 bg-light-border dark:bg-dark-border rounded w-24" />
    </div>
  );
}