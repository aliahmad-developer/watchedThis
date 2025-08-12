// app/production/[id]/page.tsx
import MediaCard from "@/app/components/mediaCard/mediaCard";
import Image from "next/image";
import Link from "next/link";
import { createSlug } from "@/app/components/utilities/createSlug";

interface Company {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
  headquarters?: string;
  description?: string; 
}

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: string;
}

interface CompanyData {
  company: Company;
  movies: MediaItem[];
  tv: MediaItem[];
}

async function getCompanyData(id: string): Promise<CompanyData> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/company/${id}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch company");
  return res.json();
}

export default async function ProductionPage({
  params,
}: {
  params: { id: string };
}) {
  const { company, movies, tv } = await getCompanyData(params.id);

  const renderMediaGrid = (items: MediaItem[], type: "movie" | "tv") =>
    items.length > 0 && (
      <section>
        <h2 className="text-xl font-semibold mb-4">
          {type === "movie" ? "Movies" : "TV Shows"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/${type}/${createSlug(
                item.title || item.name || "untitled"
              )}/${item.id}`}
            >
              <MediaCard item={{ ...item, media_type: type }} />
            </Link>
          ))}
        </div>
      </section>
    );

  return (
    <div className="p-6 space-y-8">
      {/* Company Banner */}
      <div
        className="
          flex flex-col md:flex-row items-center gap-6
          bg-light-card dark:bg-dark-card
          p-6 rounded-2xl shadow-md border
          border-light-border dark:border-dark-border
        "
      >
        {company.logo_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w300${company.logo_path}`}
            alt={company.name}
            width={150}
            height={150}
            className="object-contain bg-white p-2 rounded-lg shadow-sm"
          />
        ) : (
          <div
            className="
              w-[150px] h-[150px] flex items-center justify-center rounded-lg
              bg-light-disabled dark:bg-dark-disabled
              text-light-secondary-text dark:text-dark-secondary-text
            "
          >
            No Logo
          </div>
        )}

        <div className="flex-1">
          <h1
            className="
              text-3xl font-bold
              text-light-header dark:text-dark-body-text
            "
          >
            {company.name}
          </h1>

          <p
            className="
              text-sm mb-1
              text-light-secondary-text dark:text-dark-secondary-text
            "
          >
            Origin Country: {company.origin_country || "Unknown"}
          </p>

          {company.headquarters && (
            <p
              className="
                text-sm mb-1
                text-light-body-text dark:text-dark-body-text
              "
            >
              HQ: {company.headquarters}
            </p>
          )}

          {company.description && (
            <p
              className="
                mt-2 text-sm leading-relaxed
                text-light-body-text dark:text-dark-body-text
              "
            >
              {company.description}
            </p>
          )}
        </div>
      </div>

      {/* Movies */}
      {renderMediaGrid(movies, "movie")}

      {/* TV Shows */}
      {renderMediaGrid(tv, "tv")}
    </div>
  );
}
