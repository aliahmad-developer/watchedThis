import { useState, useEffect } from "react";
import { MediaItem } from "../../Genre/types";

interface ClientCache {
  data: MediaItem[];
  ts: number;
}

let clientCache: ClientCache | null = null;
const CLIENT_TTL = 1000 * 60 * 5; // 5 min

export function useTrendingMedia(initialData: MediaItem[] = []) {
  const [media, setMedia]     = useState<MediaItem[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    // Server already provided data — skip client fetch
    if (initialData.length > 0) return;

    // Serve from in-memory cache if fresh
    if (clientCache && Date.now() - clientCache.ts < CLIENT_TTL) {
      setMedia(clientCache.data);
      setLoading(false);
      return;
    }

    const fetchTrendingMedia = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/trending");
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const data = await response.json();
        const results = data.results ?? [];
        clientCache = { data: results, ts: Date.now() };
        setMedia(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("[useTrendingMedia]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMedia();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { media, loading, error };
}