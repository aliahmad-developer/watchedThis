import PopularSpotlightSliderClient from "./PopularSpotlightSliderClient";
import { getSpotlightData } from "./spotlightHelper";
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
    const firstBackdrop = results[0]?.backdrop_path;

    // Preload the desktop image; client will handle mobile swap
    const preloadHref = firstBackdrop
      ? tmdbImage(firstBackdrop, "w1280")
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
        />
      </section>
    );
  } catch (err) {
    console.error("Failed to fetch spotlight data:", err);
    return (
      <section
        aria-label="Popular Spotlight Slider"
        className={`spotlight-section isolate relative z-10 ${className}`}
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
