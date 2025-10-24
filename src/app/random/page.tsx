"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "../components/utilities/loading";
import { createSlug } from "../components/utilities/createSlug";

export default function RandomPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isRedirecting) return;

    const fetchRandomMedia = async () => {
      setIsRedirecting(true);
      try {
        const response = await fetch("/api/randomCall");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        if (!data.media_type || !data.id) {
          throw new Error("Invalid data format from API");
        }

        const mediaTitle = data.title || data.name || "";

        router.push(
          `/random/${data.media_type}/${createSlug(mediaTitle)}/${data.id}`
        );
      } catch (err) {
        console.error("Failed to fetch random media:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsRedirecting(false);
      }
    };

    // Only fetch if we're not already on a redirect path
    if (!window.location.pathname.startsWith("/random/")) {
      fetchRandomMedia();
    }
  }, [router, isRedirecting]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold text-light-accent dark:text-dark-accent">Error</h1>
        <p className="text-center">{error}</p>
        <button
          onClick={() => {
            setIsRedirecting(false);
            router.push(`/random`);
          }}
          className="px-4 py-2 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loading />
      <p className="mt-4 text-gray-600">Finding something great for you...</p>
    </div>
  );
}
