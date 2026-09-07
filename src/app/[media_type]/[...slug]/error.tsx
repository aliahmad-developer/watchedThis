"use client";

import { useEffect } from "react";

export default function MediaDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[media page] render error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-light-bg dark:bg-dark-bg">
      <h1 className="text-2xl font-semibold">
        Couldn&apos;t load this page
      </h1>
      <p className="text-light-body-text dark:text-dark-body-text max-w-md">
        Something went wrong fetching this title. This is usually temporary.
      </p>
      {error.digest && (
        <p className="text-xs opacity-60">Reference: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition"
      >
        Try again
      </button>
    </div>
  );
}