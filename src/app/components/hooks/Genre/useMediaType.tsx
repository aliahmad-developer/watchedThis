// hooks/useMediaType.ts
import { useState, useEffect } from "react";

export function useMediaType() {
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlMediaType = searchParams.get("media_type");
      if (urlMediaType === "movie" || urlMediaType === "tv") {
        setMediaType(urlMediaType);
      }
    }
  }, []);

  return { mediaType, setMediaType };
}