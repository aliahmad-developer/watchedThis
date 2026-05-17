import Link from "next/link";
import { ScanSearch, Shuffle, Tv2, ArrowUpRight,LoaderPinwheel } from "lucide-react";
import React from "react";

/* ----------------------------- DATA ----------------------------- */

const FEATURED_GENRES = [
  { slug: "action", name: "Action" },
  { slug: "comedy", name: "Comedy" },
  { slug: "drama", name: "Drama" },
  { slug: "horror", name: "Horror" },
  { slug: "sci-fi", name: "Sci-Fi" },
  { slug: "romance", name: "Romance" },
  { slug: "thriller", name: "Thriller" },
  { slug: "animation", name: "Animation" },
  { slug: "crime", name: "Crime" },
  { slug: "mystery", name: "Mystery" },
  { slug: "fantasy", name: "Fantasy" },
  { slug: "documentary", name: "Documentary" },
  { slug: "adventure", name: "Adventure" },
  { slug: "biography", name: "Biography" },
  { slug: "history", name: "History" },
  { slug: "sport", name: "Sport" },
  { slug: "musical", name: "Musical" },
  { slug: "western", name: "Western" },
];

const FEATURE_LINKS = [
  { href: "/find?detect=1", text: "Scene Detection", Icon: ScanSearch },
  { href: "/random", text: "Random Picker", Icon: Shuffle },
  { href: "/echo", text: "Series Like This", Icon: Tv2 },
  { href: "/spinner", text: "Spin the Wheel", Icon: LoaderPinwheel },
];

/* ----------------------------- UI HELPERS ----------------------------- */

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        shrink-0 self-stretch relative
        flex items-center justify-center
        w-17
        border-r
        bg-light-card dark:bg-dark-card
        border-light-border dark:border-dark-border
        text-[10px] font-medium uppercase tracking-[0.13em]
        text-light-accent dark:text-dark-accent
      "
    >
      <span
        className="
          absolute left-0 top-[22%] bottom-[22%] w-0.5
          rounded-r opacity-50
          bg-accent
        "
      />
      {children}
    </div>
  );
}

/* ----------------------------- MAIN COMPONENT ----------------------------- */

export default function InternalLinkingHub() {
  return (
    <section className="w-full my-6">
      <div className="max-w-6xl mx-auto">
        <div
          className="
            rounded-lg overflow-hidden
            border
            bg-light-bg dark:bg-dark-bg
            border-light-border dark:border-dark-border
          "
        >
          {/* ---------------- GENRES ---------------- */}
          <div className="flex items-stretch">
            <RowLabel>Genres</RowLabel>

            <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5">
              {FEATURED_GENRES.map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/genre/${genre.slug}`}
                  className="
                    text-[12.5px] font-normal leading-none
                    px-3 py-1 rounded-full
                    border
                    border-light-border dark:border-dark-border
                    text-light-secondary-text dark:text-dark-secondary-text
                    transition-all duration-150

                    hover:bg-accent
                    hover:border-accent
                    hover:text-accent-text
                    active:scale-95

                    /* --- Responsive visibility via nth-child ---
                       mobile : show 1–4   (hide 5+)
                       sm     : show 1–6   (hide 7+)
                       md     : show 1–10  (hide 11+)
                       lg     : show 1–14  (hide 15+)
                       xl     : show all
                    */
                    inline-flex

                    [&:nth-child(n+5:hidden

                    sm:[&:nth-child(n+5:inline-flex
                    sm:[&:nth-child(n+7:hidden

                    md:[&:nth-child(n+7:inline-flex
                    md:[&:nth-child(n+11:hidden

                    lg:[&:nth-child(n+11:inline-flex
                    lg:[&:nth-child(n+15:hidden

                    xl:[&:nth-child(n+15:inline-flex
                  "
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>

          {/* divider */}
          <div className="h-px bg-light-border dark:bg-dark-border" />

          {/* ---------------- TOOLS ---------------- */}
          <div className="flex items-stretch">
            <RowLabel>Tools</RowLabel>

            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
              {FEATURE_LINKS.map(({ href, text, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="
                    group inline-flex items-center gap-1.5
                    text-[12.5px] font-medium leading-none
                    px-3 py-1.25 rounded-md
                    border

                    border-accent
                    bg-accent-muted
                    text-accent

                    hover:bg-accent
                    hover:text-accent-text
                    hover:border-accent

                    transition-all duration-150
                    active:scale-95
                  "
                >
                  <Icon
                    size={13}
                    strokeWidth={2}
                    className="
                      opacity-60 group-hover:opacity-100
                      transition-all duration-150
                    "
                  />

                  {text}

                  <ArrowUpRight
                    size={11}
                    strokeWidth={2.5}
                    className="
                      opacity-0 -ml-1 w-0
                      group-hover:opacity-100
                      group-hover:w-2.75
                      group-hover:ml-0
                      transition-all duration-150
                    "
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- SKELETON ----------------------------- */

export function InternalLinkingHubSkeleton() {
  return (
    <section className="w-full my-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="
            rounded-lg overflow-hidden
            border
            bg-light-bg dark:bg-dark-bg
            border-light-border dark:border-dark-border
            animate-pulse
          "
        >
          {/* Genres skeleton */}
          <div className="flex items-stretch">
            <div className="w-17 bg-light-card dark:bg-dark-card" />

            <div className="flex gap-2 px-4 py-3 flex-wrap">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="
                    h-5.5 w-17.5
                    rounded-full
                    bg-light-card dark:bg-dark-card
                  "
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-light-border dark:bg-dark-border" />

          {/* Tools skeleton */}
          <div className="flex items-stretch">
            <div className="w-[68px] bg-light-card dark:bg-dark-card" />

            <div className="flex gap-2 px-4 py-3 flex-wrap">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="
                    h-7 w-30
                    rounded-md
                    bg-light-card dark:bg-dark-card
                  "
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
