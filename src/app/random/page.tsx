"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "../components/utilities/loading";

export default function RandomPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRandomMedia = async () => {
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
        const slug = mediaTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/--+/g, "-");

        router.push(`/random/${data.media_type}/${slug}/${data.id}`);
      } catch (err) {
        console.error("Failed to fetch random media:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchRandomMedia();
  }, [router]);
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
