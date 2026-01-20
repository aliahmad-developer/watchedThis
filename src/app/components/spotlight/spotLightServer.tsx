import PopularSpotlightSliderClient from "./PopularSpotlightSliderClient";
import { getSpotlightData } from "../../lib/spolight";

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
