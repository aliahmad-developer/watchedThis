import { headers } from "next/headers";
import PopularSpotlightSliderClient from "./spotLightClient";
import { MediaItem } from "./types";
import Head from "next/head"; // For meta tags

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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}${apiEndpoint}`,
      {
        next: { revalidate: 60 },
      }
    );
    const data = await res.json();
    const results: MediaItem[] = data.results?.slice(0, maxItems) || [];

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const isMobile = /Mobile|Android|iP(ad|hone)/i.test(userAgent);

    const firstItem = results[0];
    const seoTitle = firstItem?.title || firstItem?.name || "Spotlight";
    const seoDescription =
      firstItem?.overview?.slice(0, 160) ||
      "Discover the latest popular movies and TV shows in our spotlight.";

    return (
      <>
        {/* SEO Meta Tags */}
        <Head>
          <title>{seoTitle} | Spotlight</title>
          <meta name="description" content={seoDescription} />
          <meta property="og:title" content={seoTitle} />
          <meta property="og:description" content={seoDescription} />
          {firstItem?.backdrop_path && (
            <meta
              property="og:image"
              content={`https://image.tmdb.org/t/p/w1280${firstItem.backdrop_path}`}
            />
          )}
          <meta property="og:type" content="website" />
        </Head>

        {/* Main Content */}
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
            isMobile={isMobile}
          />
        </section>
      </>
    );
  } catch (err) {
    console.error("Failed to fetch spotlight data:", err);
    return null;
  }
}
