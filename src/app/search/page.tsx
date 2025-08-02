"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loading from "../components/utilities/loading";
import MediaCard from "../components/mediaCard/mediaCard";

export default function SearchClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // ✅ Correctly extract `q`
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        setResults(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (!query) return <p className="text-center mt-8">No query provided.</p>;
  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for "{query}"
      </h1>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
          {results.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() =>
                router.push(
                  `/${item.media_type}/${createSlug(item.title || item.name)}/${item.id}`
                )
              }
            />
          ))}
        </div>
      ) : (
        <p>No results found for "{query}"</p>
      )}
    </div>
  );
}

function createSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}
