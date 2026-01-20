import PopularSpotlightSliderClient from "./PopularSpotlightSliderClient";
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
  maxItems = 8,
  className = "",
  height = "420px",
  showNavigation = true,
  showSpotlightNumber = true,
  autoPlay = true,
}: PopularSpotlightSliderServerProps) {
  try {
    // 🔹 Use environment variable for base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

    const apiUrl = `${baseUrl}${apiEndpoint}`;

    const res = await fetch(apiUrl, { next: { revalidate: 60 } });

    if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);

    const data = await res.json();
    const results: MediaItem[] = data.results?.slice(0, maxItems) || [];

    return (
      <section
        aria-label="Popular Spotlight Slider"
        className={`spotlight-section ${className}`}
      >
        <PopularSpotlightSliderClient
          items={results}
          slideDuration={slideDuration}
          className={className}
          height={height}
          showNavigation={showNavigation}
          showSpotlightNumber={showSpotlightNumber}
          autoPlay={autoPlay}
        />
      </section>
    );
  } catch (err) {
    console.error("Failed to fetch spotlight data:", err);

    return (
      <section
        aria-label="Popular Spotlight Slider"
        className={`spotlight-section ${className}`}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-light-accent dark:text-dark-accent">
            Failed to load spotlight content. Please try again later.
          </p>
        </div>
      </section>
    );
  }
}
