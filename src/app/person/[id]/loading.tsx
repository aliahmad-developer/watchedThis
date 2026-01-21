export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="shrink-0 mx-auto md:mx-0">
          <div className="w-75 h-112.5 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        </div>
        <div className="grow space-y-4">
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}