export default function MediaPosterSkeleton() {
  return (
    <div className="relative aspect-[2/3] mx-auto rounded-2xl overflow-hidden bg-light-border dark:bg-dark-border animate-pulse w-32 sm:w-48 md:w-56 lg:w-full lg:max-w-[240px] xl:max-w-xs">
      <div className="absolute top-3 left-3 w-16 h-6 bg-white/10 rounded-md" />
    </div>
  );
}