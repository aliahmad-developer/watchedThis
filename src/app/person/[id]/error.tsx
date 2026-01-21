"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Person page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-light-header dark:text-white">
          Something went wrong
        </h1>
        <p className="mb-4 text-light-secondary-text dark:text-dark-secondary-text">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}