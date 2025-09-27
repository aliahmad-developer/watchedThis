interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <section className="relative px-4 w-full">
      <h2 className="text-3xl font-bold mb-6">Trending</h2>
      <div className="text-center py-8 text-red-500">
        <p>Failed to load trending content: {error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-light-accent text-white rounded hover:bg-opacity-90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </section>
  );
}