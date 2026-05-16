import { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  metadataBase: new URL("https://watchedthis.com"),

  title: "Productions – Browse Movie & TV Studios | WatchedThis",

  description:
    "Browse movies and TV shows by production companies and studios including Marvel Studios, Pixar, A24, Warner Bros., Netflix, HBO, and more.",

  keywords: [
    "production companies",
    "movie studios",
    "tv studios",
    "browse by studio",
    "movies by production company",
    "movie production companies",
    "tv production companies",
    "Marvel Studios movies",
    "Pixar movies",
    "Warner Bros movies",
    "A24 films",
    "Netflix originals",
    "HBO shows",
  ],

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "/production",
  },

  openGraph: {
    title: "Productions – Browse Movie & TV Studios | WatchedThis",

    description:
      "Discover movies and TV shows from top production companies and studios.",

    type: "website",

    url: "https://watchedthis.com/production",

    siteName: "WatchedThis",
  },

  twitter: {
    card: "summary_large_image",

    title: "Productions – Browse Movie & TV Studios | WatchedThis",

    description:
      "Browse movies and TV shows from Marvel Studios, Pixar, A24, Netflix, HBO, and more.",
  },
};

const PRODUCTIONS: {
  id: number;
  name: string;
}[] = [
  { id: 420, name: "Marvel Studios" },
  { id: 9993, name: "DC Studios" },
  { id: 174, name: "Warner Bros." },
  { id: 33, name: "Universal Pictures" },
  { id: 25, name: "20th Century Studios" },
  { id: 4, name: "Paramount Pictures" },
  { id: 2, name: "Walt Disney Pictures" },
  { id: 521, name: "A24" },
  { id: 34, name: "Sony Pictures" },
  { id: 11, name: "Pixar" },
  { id: 7505, name: "Netflix" },
  { id: 3268, name: "HBO" },
  { id: 1957, name: "Legendary Entertainment" },
  { id: 12, name: "New Line Cinema" },
  { id: 1632, name: "Lionsgate" },
  { id: 7, name: "DreamWorks" },
  { id: 923, name: "Blumhouse" },
  { id: 3036, name: "Working Title Films" },
  { id: 41, name: "Miramax" },
  { id: 5, name: "Columbia Pictures" },
  { id: 82819, name: "Apple TV+" },
  { id: 49, name: "Amazon Studios" },
  { id: 6704, name: "Village Roadshow" },
];

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ProductionsSchema() {
  const schema = {
    "@context": "https://schema.org",

    "@type": "CollectionPage",

    name: "Production Companies",

    url: "https://watchedthis.com/production",

    description:
      "Browse movies and TV shows by production studios and companies.",

    publisher: {
      "@type": "Organization",

      name: "WatchedThis",

      url: "https://watchedthis.com",
    },

    hasPart: PRODUCTIONS.map((p) => ({
      "@type": "Organization",

      name: p.name,

      url: `https://watchedthis.com/production/${p.id}-${toSlug(p.name)}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
      key="productions-schema"
    />
  );
}

export default async function ProductionListPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

  const productionSections = await Promise.all(
    PRODUCTIONS.map(async ({ id, name }) => {
      const [moviesRes, tvRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/production/${id}?mediaType=movie&page=1`, {
          next: {
            revalidate: 3600,
          },
        }),

        fetch(`${baseUrl}/api/production/${id}?mediaType=tv&page=1`, {
          next: {
            revalidate: 3600,
          },
        }),
      ]);

      const movies =
        moviesRes.status === "fulfilled" && moviesRes.value.ok
          ? ((await moviesRes.value.json()).results ?? []).map((m: any) => ({
              ...m,
              media_type: "movie",
            }))
          : [];

      const tv =
        tvRes.status === "fulfilled" && tvRes.value.ok
          ? ((await tvRes.value.json()).results ?? []).map((m: any) => ({
              ...m,
              media_type: "tv",
            }))
          : [];

      const interleaved: any[] = [];

      const m = movies.filter((x: any) => x?.poster_path);

      const t = tv.filter((x: any) => x?.poster_path);

      let mi = 0;
      let ti = 0;

      while (interleaved.length < 5 && (mi < m.length || ti < t.length)) {
        if (mi < m.length) {
          interleaved.push(m[mi++]);
        }

        if (interleaved.length < 5 && ti < t.length) {
          interleaved.push(t[ti++]);
        }
      }

      return {
        id,
        name,
        top: interleaved,
      };
    }),
  );

  return (
    <>
      <h1 className="sr-only">Browse Movie and TV Production Companies</h1>

      <Breadcrumbs
        crumbs={[
          {
            name: "Home",
            href: "/",
          },
          {
            name: "Productions",
            href: "/production",
          },
        ]}
      />

      <div className="container mx-auto px-4 py-8 min-h-screen">
        <h2 className="text-center font-semibold mb-3">Browse by studio</h2>

        <div className="flex flex-wrap gap-2 mb-8">
          {PRODUCTIONS.map(({ id, name }) => (
            <a
              key={id}
              href={`/production/${id}-${toSlug(name)}`}
              className="
                  px-3 py-1 rounded-full border text-sm
                  border-light-accent/30 dark:border-dark-accent/30
                  text-light-accent dark:text-dark-accent
                  bg-light-accent/5 dark:bg-dark-accent/5
                  hover:bg-light-accent/15 dark:hover:bg-dark-accent/15
                  hover:border-light-accent dark:hover:border-dark-accent
                  transition-colors duration-200
                "
            >
              {name}
            </a>
          ))}
        </div>

        {productionSections.map(({ id, name, top }) => (
          <section key={id} className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Popular in {name}</h3>

              <a
                href={`/production/${id}-${toSlug(name)}`}
                className="
                    group
                    flex
                    items-center
                    text-sm
                    font-medium
                    leading-none
                    text-light-accent
                    dark:text-dark-accent
                  "
              >
                <span className="hover:underline underline-offset-4 m-0">
                  See all
                </span>

                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="
                      ml-1
                      text-[10px]
                      translate-y-[0.5px]
                      transition-transform
                      duration-200
                      group-hover:translate-x-1
                    "
                />
              </a>
            </div>

            {top.length ? (
              <div
                className="
                    grid
                    grid-cols-2
                    sm:grid-cols-3
                    lg:grid-cols-5
                    gap-4
                  "
              >
                {top.map((m: any, index: number) => (
                  <div
                    key={m.id}
                    className={`
                          ${index >= 4 ? "hidden lg:block" : ""}
                          ${index >= 3 ? "sm:hidden lg:block" : ""}
                        `}
                  >
                    <MediaCard item={m} index={index} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No popular items right now.</p>
            )}
          </section>
        ))}
      </div>

      <ProductionsSchema />
    </>
  );
}
