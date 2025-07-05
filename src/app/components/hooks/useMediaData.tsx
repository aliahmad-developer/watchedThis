// hooks/useMediaData.ts
import { useState,useEffect } from "react";
export function useMediaData(mediaType: string, id: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/media/${mediaType}/${id}`);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load media");
      }
    };

    fetchData();
  }, [mediaType, id]);

  return { data, error };
}