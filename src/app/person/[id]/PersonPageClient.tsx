"use client";

import Image from "next/image";
import Loading from "@/app/components/utilities/loading";
import Link from "next/link";
import slugify from "slugify";
import { useMediaType } from "@/app/components/hooks/Genre/useMediaType";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { useEffect, useState, useRef } from "react";
import { GenreHeader } from "@/app/components/Genre/mediaTypeToggle";

// ----------------------
// Types
// ----------------------
interface Credit {
  id: number;
  title: string;
  character?: string;
  job?: string;
  poster_path: string | null;
  media_type: string;
  release_date: string | null;
  vote_average?: number;
  runtime?: number | null;
  episode_run_time?: number[] | null;
}

interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

interface PersonData {
  details: PersonDetails;
  credits: {
    cast: Credit[];
    crew: Credit[];
  } | null;
  images: {
    profiles: Array<{
      file_path: string;
      width: number;
      height: number;
    }>;
  } | null;
}

// ----------------------
// Fetch person data
// ----------------------
async function getPersonData(id?: string) {
  if (!id) throw new Error("Invalid person ID");

  const res = await fetch(`/api/person/${id}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch person data: ${res.status}`);
  }

  const data = await res.json();
  if (!data.details) throw new Error(data.error || "Person not found");

  return data;
}

// ----------------------
// Helpers
// ----------------------
const createCreditSlug = (title: string, id: number, mediaType: string) => {
  return `/${mediaType}/${slugify(title, { lower: true, strict: true })}/${id}`;
};

// ----------------------
// Biography Section
// ----------------------
const BiographySection = ({
  bioText,
  showFullBio,
  setShowFullBio,
  maxBioLength,
}: {
  bioText: string;
  showFullBio: boolean;
  setShowFullBio: (show: boolean) => void;
  maxBioLength: number;
}) => {
  const shouldTruncate = bioText.length > maxBioLength;
  const truncatedBio = shouldTruncate
    ? bioText.substring(0, maxBioLength) + "..."
    : bioText;

  return (
    <>
      <div className="md:hidden max-h-48 p-3 bg-light-card/20 dark:bg-dark-card/0 rounded-lg overflow-y-auto scrollbar-thin">
        <p className="text-sm whitespace-pre-wrap opacity-90">{bioText}</p>
      </div>

      <div className="hidden md:block leading-relaxed text-light-secondary-text dark:text-dark-secondary-text">
        <p>
          {showFullBio ? bioText : truncatedBio}
          {shouldTruncate && (
            <button
              onClick={() => setShowFullBio(!showFullBio)}
              className=" bg-transparent ml-1 text-light-accent dark:text-dark-accent hover:underline"
              aria-label={
                showFullBio ? "Show less biography" : "Show more biography"
              }
            >
              {showFullBio ? "- less" : "+ More"}
            </button>
          )}
        </p>
      </div>
    </>
  );
};

// ----------------------
// Skeleton Loader
// ----------------------
const PersonPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="shrink-0 mx-auto md:mx-0">
          <div className="w-75 h-112.5 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        </div>
        <div className="grow space-y-4">
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------
// Main Client Component
// ----------------------
export default function PersonPageClient({ id }: { id: string }) {
  const { mediaType, setMediaType } = useMediaType();
  const [data, setData] = useState<PersonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showFullBio, setShowFullBio] = useState(false);
  const maxBioLength = 1050;

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const personData = await getPersonData(id);
        setData(personData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const filteredCast = data?.credits?.cast.filter((c) => c.media_type === mediaType) || [];
  const filteredCrew = data?.credits?.crew.filter((c) => c.media_type === mediaType) || [];

  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader || (filteredCast.length === 0 && filteredCrew.length === 0)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          requestAnimationFrame(() => {
            setVisibleCount((prev) => prev + 10);
            setIsLoadingMore(false);
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(currentLoader);
    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [isLoadingMore, filteredCast.length, filteredCrew.length]);

  useEffect(() => {
    setVisibleCount(10);
  }, [mediaType]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-light-header dark:text-white">
            Person Not Found
          </h1>
          <p className="mb-4 text-light-secondary-text dark:text-dark-secondary-text">{error}</p>
          <Link href="/" className="text-light-accent dark:text-dark-accent hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !data) return <PersonPageSkeleton />;

  const { details, images } = data;
  const bioText = details.biography || "No biography available.";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen bg-light-bg dark:bg-dark-bg space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
        <div className="shrink-0 mx-auto md:mx-0">
          {details.profile_path ? (
            <Image
              draggable={false}
              src={`https://image.tmdb.org/t/p/w500${details.profile_path}`}
              alt={details.name}
              width={300}
              height={450}
              className="rounded-xl object-cover shadow-lg w-75 h-112.5"
              priority
            />
          ) : (
            <div className="w-75 h-112.5 flex items-center justify-center bg-gray-300 dark:bg-gray-700 rounded-xl shadow-lg">
              <span className="text-gray-500">No Image Available</span>
            </div>
          )}
        </div>
        <div className="grow">
          <h1 className="text-4xl font-bold text-light-accent dark:text-dark-accent mb-2 p-1">
            {details.name}
          </h1>
          <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text mb-4">
            {details.known_for_department}
          </p>
          <h2 className="text-2xl font-semibold text-light-header dark:text-white mb-4">
            Biography
          </h2>
          <BiographySection
            bioText={bioText}
            showFullBio={showFullBio}
            setShowFullBio={setShowFullBio}
            maxBioLength={maxBioLength}
          />
        </div>
      </div>

      {/* Credits Section */}
      {data.credits && (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <GenreHeader genreName="Filmography" mediaType={mediaType} onMediaTypeChange={setMediaType} />
          </div>

          {/* Acting */}
          {filteredCast.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-medium text-light-header dark:text-gray-200 mb-4">Acting</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCast.slice(0, visibleCount).map((credit, index) => (
                  <Link
                    key={`cast-${credit.media_type}-${credit.id}-${index}`}
                    href={createCreditSlug(credit.title, credit.id, credit.media_type)}
                    aria-label={`View ${credit.title}`}
                  >
                    <MediaCard
                      item={{
                        id: credit.id,
                        title: credit.title,
                        name: credit.title,
                        poster_path: credit.poster_path || undefined,
                        media_type: credit.media_type,
                        runtime: credit.runtime || undefined,
                        episode_run_time: credit.episode_run_time || undefined,
                      }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Crew */}
          {filteredCrew.length > 0 && (
            <div>
              <h3 className="text-xl font-medium text-light-header dark:text-gray-200 mb-4">Production</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCrew.slice(0, visibleCount).map((credit, index) => (
                  <Link
                    key={`crew-${credit.media_type}-${credit.id}-${credit.job || "unknown"}-${index}`}
                    href={createCreditSlug(credit.title, credit.id, credit.media_type)}
                    aria-label={`View ${credit.title}`}
                  >
                    <MediaCard
                      item={{
                        id: credit.id,
                        title: credit.title,
                        name: credit.title,
                        poster_path: credit.poster_path || undefined,
                        media_type: credit.media_type,
                        runtime: credit.runtime || undefined,
                        episode_run_time: credit.episode_run_time || undefined,
                      }}
                      displayTitle={credit.job || ""}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Loader */}
          {(visibleCount < filteredCast.length || visibleCount < filteredCrew.length) && (
            <div ref={loaderRef} className="h-20 flex justify-center items-center mt-6" aria-live="polite">
              {isLoadingMore && <Loading hideText size="sm" />}
            </div>
          )}
        </div>
      )}

      {/* Gallery */}
      {images && images.profiles.length > 0 && (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-light-header dark:text-white mb-6">Gallery</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.profiles.map((image) => (
              <div key={image.file_path} className="overflow-hidden rounded-lg shadow-md">
                <Image
                  draggable={false}
                  src={`https://image.tmdb.org/t/p/w300${image.file_path}`}
                  alt={`${details.name} portrait`}
                  width={200}
                  height={250}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}