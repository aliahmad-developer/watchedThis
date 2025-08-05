import { headers } from "next/headers";
import PopularSpotlightSliderClient from "./spotLightClient";
import { MediaItem } from "./types";

interface PopularSpotlightSliderServerProps {
  apiEndpoint?: string;
  slideDuration?: number;
  maxItems?: number;
  className?: string;
  height?: number | string;
  showNavigation?: boolean;
  showSpotlightNumber?: boolean;
  autoPlay?: boolean;
}

export default async function PopularSpotlightSliderServer({
  apiEndpoint = "/api/spotLight",
  slideDuration = 5000,
  maxItems = 10,
  className = "",
  height = "420px",
  showNavigation = true,
  showSpotlightNumber = true,
  autoPlay = true,
}: PopularSpotlightSliderServerProps) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}${apiEndpoint}`,
      {
        next: { revalidate: 60 },
      }
    );
    const data = await res.json();
    const results: MediaItem[] = data.results?.slice(0, maxItems) || [];

    // Correct way to use headers() in Next.js 13+
    const headersList =await headers();
    const userAgent = headersList.get("user-agent") || "";

    const isMobile = /Mobile|Android|iP(ad|hone)/i.test(userAgent);

    return (
      <PopularSpotlightSliderClient
        items={results}
        slideDuration={slideDuration}
        className={className}
        height={height}
        showNavigation={showNavigation}
        showSpotlightNumber={showSpotlightNumber}
        autoPlay={autoPlay}
        isMobile={isMobile}
      />
    );
  } catch (err) {
    console.error("Failed to fetch spotlight data:", err);
    return null;
  }
}