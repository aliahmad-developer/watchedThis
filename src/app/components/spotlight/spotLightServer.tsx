import PopularSpotlightSliderClient from "./PopularSpotlightSliderClient";
import { getSpotlightData } from "./spotlightHelper";
import { headers } from "next/headers";
import { tmdbImage } from "@/lib/imageTmdb";

export default async function PopularSpotlightSliderServer({
  slideDuration = 5000,
  className = "",
  height = "420px",
  showNavigation = true,
  showSpotlightNumber = true,
  autoPlay = true,
}: any) {
  try {
    const results = await getSpotlightData();
    const headersList = await headers();
    const ua = headersList.get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    const firstBackdrop = results[0]?.backdrop_path;

    const tmdbSize = isMobile ? "w780" : "w1280";
    // ✅ use proxy URL instead of direct TMDB
    const preloadHref = firstBackdrop
      ? tmdbImage(firstBackdrop, tmdbSize)
      : null;

    return (
      <section
        aria-label="Popular Spotlight Slider"
        className={`spotlight-section ${className}`}
      >
        {preloadHref && (
          <link
            rel="preload"
            as="image"
            href={preloadHref}
            fetchPriority="high"
            imageSizes="100vw"
          />
        )}
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
