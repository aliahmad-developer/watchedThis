import { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import PersonPageClient from "./PersonPageClient";
import { fetchPerson } from "@/lib/fetchPerson";

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    id: string;
    slug: string;
  }>;
}): Promise<Metadata> {
  const { id, slug } = await params;

  try {
    const data = await fetchPerson(id);

    if (!data?.details) {
      return {
        title: "Person Not Found | WatchedThis",

        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const name = data.details.name || "Unknown Person";

    const biography = data.details.biography || "";

    const description = biography
      ? `${biography.substring(0, 155)}...`
      : `Explore movies and TV shows featuring ${name}. Discover filmography, cast appearances, acting credits, and more on WatchedThis.`;

    const ogUrl = new URL("/og/", "https://watchedthis.com");

    ogUrl.searchParams.set("title", name);

    ogUrl.searchParams.set("subtitle", description);

    if (data.details.profile_path) {
      ogUrl.searchParams.set("poster", data.details.profile_path);
    }

    return {
      metadataBase: new URL("https://watchedthis.com"),

      title: `${name} | Actor & Filmography | WatchedThis`,

      description,

      keywords: [
        name,
        `${name} movies`,
        `${name} tv shows`,
        `${name} filmography`,
        `${name} cast`,
        `${name} actor`,
        `${name} actress`,
        "actor filmography",
        "cast movies",
        "movie cast",
        "tv cast",
      ],

      robots: {
        index: true,
        follow: true,
      },

      alternates: {
        canonical: `/person/${slug}/${id}`,
      },

      openGraph: {
        title: `${name} | WatchedThis`,

        description,

        type: "profile",

        url: `https://watchedthis.com/person/${slug}/${id}`,

        siteName: "WatchedThis",

        images: [
          {
            url: ogUrl.toString(),

            width: 1200,
            height: 630,

            alt: `${name} — WatchedThis`,
          },
        ],
      },

      twitter: {
        card: "summary_large_image",

        title: `${name} | WatchedThis`,

        description,

        images: [ogUrl.toString()],
      },
    };
  } catch {
    return {
      title: "Person | WatchedThis",

      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

function PersonSchema({
  id,
  slug,
  name,
  image,
  biography,
}: {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  biography?: string | null;
}) {
  const schema = {
    "@context": "https://schema.org",

    "@type": "Person",

    name,

    url: `https://watchedthis.com/person/${slug}/${id}`,

    ...(biography && {
      description: biography,
    }),

    ...(image && {
      image: `https://image.tmdb.org/t/p/w500${image}`,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
      key="person-schema"
    />
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{
    id: string;
    slug: string;
  }>;
}) {
  const { id, slug } = await params;

  const data = await fetchPerson(id);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Person not found.</p>
      </main>
    );
  }

  const details = data.details || {};

  const name = details.name || "Person";

  return (
    <>
      <h1 className="sr-only">{name} Movies, TV Shows, and Filmography</h1>

      <Breadcrumbs
        crumbs={[
          {
            name: "Home",
            href: "/",
          },
          {
            name: "People",
            href: "/person",
          },
          {
            name,
            href: `/person/${slug}/${id}`,
          },
        ]}
      />

      <PersonPageClient id={id} slug={slug} initialData={data} />

      <PersonSchema
        id={id}
        slug={slug}
        name={name}
        image={details.profile_path}
        biography={details.biography}
      />
    </>
  );
}
