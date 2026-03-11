"use client";

import Image from "next/image";
import Link from "next/link";
import slugify from "slugify";
import Loading from "@/app/components/utilities/loading"; 
import { useMediaType } from "@/app/components/hooks/Genre/useMediaType";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { useEffect, useState, useRef } from "react";
import { GenreHeader } from "@/app/components/Genre/mediaTypeToggle";

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
  credits: { cast: Credit[]; crew: Credit[] } | null;
  images: { profiles: Array<{ file_path: string; width: number; height: number }> } | null;
}

async function getPersonData(id?: string) {
  if (!id) throw new Error("Invalid person ID");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${baseUrl}/api/person/${id}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch person data: ${res.status}`);
  }
  const data = await res.json();
  if (!data.details) throw new Error(data.error || "Person not found");
  return data;
}


const createCreditSlug = (title: string, id: number, mediaType: string) =>
  `/${mediaType}/${slugify(title, { lower: true, strict: true })}/${id}`;

const PersonPageSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen bg-light-bg dark:bg-dark-bg space-y-12 animate-pulse">

    {/* Header */}
    <div className="flex flex-col md:flex-row gap-8 bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
      <div className="shrink-0 mx-auto md:mx-0 w-75 h-112.5 bg-gray-300 dark:bg-gray-700 rounded-xl" />
      <div className="grow flex flex-col gap-4">
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-7 bg-gray-300 dark:bg-gray-700 rounded w-32 mt-2" />
        <div className="space-y-2.5">
          {[100, 92, 96, 85, 90, 78, 88, 94, 80].map((w, i) => (
            <div key={i} className="h-3.5 bg-gray-300 dark:bg-gray-700 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>

    {/* Filmography */}
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-44 mb-6" />
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-2/3 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>

    {/* Gallery */}
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-6" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-2/3 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

export default function PersonPageClient({ id }: { id: string }) {
  const { mediaType, setMediaType } = useMediaType();
  const [data, setData] = useState<PersonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [id]);

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
          requestAnimationFrame(() => { setVisibleCount((prev) => prev + 10); setIsLoadingMore(false); });
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(currentLoader);
    return () => { if (currentLoader) observer.unobserve(currentLoader); };
  }, [isLoadingMore, filteredCast.length, filteredCrew.length]);

  useEffect(() => { setVisibleCount(10); }, [mediaType]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-light-header dark:text-white">Person Not Found</h1>
        <p className="mb-4 text-light-secondary-text dark:text-dark-secondary-text">{error}</p>
        <Link href="/" className="text-light-accent dark:text-dark-accent hover:underline">Return to Home</Link>
      </div>
    </div>
  );

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

        <div className="grow flex flex-col min-h-0">
          <h1 className="text-4xl font-bold text-light-accent dark:text-dark-accent mb-2 p-1">
            {details.name}
          </h1>
          <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text mb-4">
            {details.known_for_department}
          </p>
          <h2 className="mb-4">
            Biography
          </h2>
          {/* Scrollable bio — never stretches the card */}
          <div className="overflow-y-auto max-h-72 md:max-h-80 pr-2 scrollbar-thin scrollbar-thumb-light-border dark:scrollbar-thumb-dark-border scrollbar-track-transparent">
            <p className="text-sm md:text-base leading-relaxed text-light-secondary-text dark:text-dark-secondary-text whitespace-pre-wrap">
              {bioText}
            </p>
          </div>
        </div>
      </div>

      {/* Credits Section */}
      {data.credits && (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <GenreHeader genreName="Filmography" mediaType={mediaType} onMediaTypeChange={setMediaType} />
          </div>

          {filteredCast.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-medium text-light-header dark:text-gray-200 mb-4">Acting</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCast.slice(0, visibleCount).map((credit, index) => (
                  <Link key={`cast-${credit.media_type}-${credit.id}-${index}`}
                    href={createCreditSlug(credit.title, credit.id, credit.media_type)}
                    aria-label={`View ${credit.title}`}>
                    <MediaCard item={{ id: credit.id, title: credit.title, name: credit.title, poster_path: credit.poster_path || undefined, media_type: credit.media_type, runtime: credit.runtime || undefined, episode_run_time: credit.episode_run_time || undefined }} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {filteredCrew.length > 0 && (
            <div>
              <h3 className="text-xl font-medium text-light-header dark:text-gray-200 mb-4">Production</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCrew.slice(0, visibleCount).map((credit, index) => (
                  <Link key={`crew-${credit.media_type}-${credit.id}-${credit.job || "unknown"}-${index}`}
                    href={createCreditSlug(credit.title, credit.id, credit.media_type)}
                    aria-label={`View ${credit.title}`}>
                    <MediaCard item={{ id: credit.id, title: credit.title, name: credit.title, poster_path: credit.poster_path || undefined, media_type: credit.media_type, runtime: credit.runtime || undefined, episode_run_time: credit.episode_run_time || undefined }} displayTitle={credit.job || ""} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(visibleCount < filteredCast.length || visibleCount < filteredCrew.length) && (
            <div ref={loaderRef} className="h-20 flex justify-center items-center mt-6" aria-live="polite">
              {isLoadingMore && <Loading/>}
            </div>
          )}
        </div>
      )}

      {/* Gallery */}
      {images && images.profiles.length > 0 && (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
          <h2 className="mb-6">Gallery</h2>
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