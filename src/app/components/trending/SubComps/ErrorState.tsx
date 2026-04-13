import { faHashtag } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <section className="relative px-4 w-full">
      <div className="flex items-center justify-between gap-2 mb-6 px-1">
                {/* Left — title */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faHashtag}
                    className="text-light-accent dark:text-dark-accent ml-1"
                    style={{ width: "1.5rem", height: "1.5rem" }}
                  />
                  <h2>Trending</h2>
                </div>
                </div>
      <div className="text-center py-8 text-light accent dark:text-dark-accent">
        <p>Failed to load trending content: {error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded-lg hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg transition-colors"
        >
          Try Again
        </button>
      </div>
    </section>
  );
}