export default function MediaPosterSkeleton() {
  return (
    <div className="relative aspect-2/3 w-full max-w-xs rounded-2xl overflow-hidden bg-light-border dark:bg-dark-border animate-pulse">
      <div className="absolute top-3 left-3 w-16 h-6 bg-light-border dark:bg-dark-border rounded-md brightness-90" />
    </div>
  );
}