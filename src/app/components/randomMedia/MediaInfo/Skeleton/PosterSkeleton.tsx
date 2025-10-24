// components/skeleton/MediaPosterSkeleton.tsx
export default function MediaPosterSkeleton() {
  return (
    <div className="relative aspect-[2/3] w-full max-w-xs rounded-2xl overflow-hidden bg-gray-300 dark:bg-gray-700 animate-pulse">
      {/* Badge Skeleton */}
      <div className="absolute top-3 left-3 w-16 h-6 bg-gray-400 dark:bg-gray-600 rounded-md"></div>
    </div>
  );
}