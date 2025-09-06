"use client";

import Image from "next/image";
import Loading from "@/app/components/utilities/loading";
import Link from "next/link";
import slugify from "slugify"; // npm install slugify
import { useMediaType } from "@/app/components/hooks/Genre/useMediaType";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { useEffect, useState, use } from "react";

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
}

interface PersonData {
  details: {
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    profile_path: string | null;
    known_for_department: string;
    popularity: number;
  };
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
// API Call
// ----------------------
async function getPersonData(id: string): Promise<PersonData> {
  const res = await fetch(`http://localhost:3000/api/person/${id}`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Person not found");
    throw new Error("Failed to fetch person data");
  }

  return res.json();
}

// ----------------------
// Person Page Component
// ----------------------
export default function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { mediaType, setMediaType } = useMediaType();
  const [data, setData] = useState<PersonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // biography toggle
  const [showFullBio, setShowFullBio] = useState(false);
  const maxBioLength = 250;

  // infinite scroll credits
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    getPersonData(id)
      .then((res) => setData(res))
      .catch((err) => setError(err.message));
  }, [id]);

  // infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300
      ) {
        setVisibleCount((prev) => prev + 10);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Person Not Found</h1>
          <p className="mb-4">The person you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="text-light-accent dark:text-dark-accent hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return <Loading centerInParent fullScreen />;
  }

  const { details, credits, images } = data;
  const filteredCast =
    credits?.cast.filter((c) => c.media_type === mediaType) || [];
  const filteredCrew =
    credits?.crew.filter((c) => c.media_type === mediaType) || [];

  const bioText = details.biography || "No biography available.";
  const shouldTruncate = bioText.length > maxBioLength;
  const truncatedBio = shouldTruncate
    ? bioText.substring(0, maxBioLength) + "..."
    : bioText;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Profile Image */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          {details.profile_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${details.profile_path}`}
              alt={details.name}
              width={300}
              height={200}
              className="rounded-xl object-cover shadow-lg"
              priority
            />
          ) : (
            <div className="w-[300px] h-[450px] flex items-center justify-center bg-gray-300 dark:bg-gray-700 rounded-xl shadow-lg">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-grow">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 p-1">
            {details.name}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {details.known_for_department}
          </p>

          {/* Biography */}
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Biography
          </h2>

          {/* Mobile: scrollable box */}
          <div className="md:hidden max-h-40 p-3 bg-light-card/20 dark:bg-dark-card/10 rounded-lg overflow-y-auto scrollbar-thin">
            <p className="text-sm whitespace-pre-wrap opacity-90">{bioText}</p>
          </div>

          {/* Desktop: truncation + toggle */}
          <div className="hidden md:block leading-relaxed text-light-secondary-text dark:text-dark-secondary-text">
            <p>
              {showFullBio ? bioText : truncatedBio}
              {shouldTruncate && (
                <span
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="cursor-pointer inline ml-1 text-light-accent dark:text-dark-accent"
                >
                  {showFullBio ? "- less" : "+ More"}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Credits Section */}
      {credits && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Filmography
            </h2>

            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => {
                  setMediaType("movie");
                  setVisibleCount(10);
                }}
                className={`px-6 py-2 rounded-full ${
                  mediaType === "movie"
                    ? "bg-light-accent text-white"
                    : "bg-light-card dark:bg-dark-card"
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => {
                  setMediaType("tv");
                  setVisibleCount(10);
                }}
                className={`px-6 py-2 rounded-full ${
                  mediaType === "tv"
                    ? "bg-light-accent text-white"
                    : "bg-light-card dark:bg-dark-card"
                }`}
              >
                TV Shows
              </button>
            </div>
          </div>

          {/* Acting Credits */}
          {filteredCast.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">
                Acting
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCast.slice(0, visibleCount).map((credit) => (
                  <Link
                    key={`cast-${credit.id}`}
                    href={`/${credit.media_type}/${slugify(credit.title, {
                      lower: true,
                      strict: true,
                    })}/${credit.id}`}
                  >
                    <MediaCard
                      item={{
                        id: credit.id,
                        title: credit.title,
                        name: credit.title,
                        poster_path: credit.poster_path || undefined,
                        media_type: credit.media_type,
                      }}
                      displayTitle={credit.character || ""}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Crew Credits */}
          {/* Crew Credits */}
          {filteredCrew.length > 0 && (
            <div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">
                Production
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCrew.slice(0, visibleCount).map((credit, index) => (
                  <Link
                    key={`crew-${credit.id}-${credit.job || index}`}
                    href={`/${credit.media_type}/${slugify(credit.title, {
                      lower: true,
                      strict: true,
                    })}/${credit.id}`}
                  >
                    <MediaCard
                      item={{
                        id: credit.id,
                        title: credit.title,
                        name: credit.title,
                        poster_path: credit.poster_path || undefined,
                        media_type: credit.media_type,
                      }}
                      displayTitle={credit.job || ""}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gallery Section */}
      {images && images.profiles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Gallery
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.profiles.slice(0, 12).map((image, index) => (
              <div key={index} className="overflow-hidden rounded-lg shadow-md">
                <Image
                  src={`https://image.tmdb.org/t/p/w300${image.file_path}`}
                  alt={`${details.name} - Image ${index + 1}`}
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
