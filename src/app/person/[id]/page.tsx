import { Metadata } from "next";
import PersonPageClient from "./PersonPageClient";

const fetchPerson = async (id: string) => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://watchedthis.com";
    const res = await fetch(`${baseUrl}/api/person/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id, slug } = await params;

  // Wrap in try/catch so a fetch failure doesn't crash the entire page
  try {
    const data = await fetchPerson(id);
    if (!data?.details) return { title: "Person Not Found | WatchedThis" };

    // Your API returns { details, credits, images } — so name/biography/profile_path
    // are nested under data.details, not data directly
    const name = data.details.name || "Unknown Person";
    const description = data.details.biography
      ? `${data.details.biography.substring(0, 155)}...`
      : `Discover movies and TV shows featuring ${name} on WatchedThis.`;

    return {
      title: `${name} | WatchedThis`,
      description,
      alternates: {
        canonical: `https://watchedthis.com/person/${slug}/${id}`,
      },
      openGraph: {
        title: `${name} | WatchedThis`,
        description,
        images: data.details.profile_path
          ? [
              {
                url: `https://image.tmdb.org/t/p/w500${data.details.profile_path}`,
                width: 500,
                height: 750,
                alt: `${name} profile photo`,
              },
            ]
          : [
              {
                url: "/og-default.png",
                width: 1200,
                height: 630,
                alt: "WatchedThis",
              },
            ],
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} | WatchedThis`,
        description,
      },
    };
  } catch {
    return { title: "Person | WatchedThis" };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <h1 className="sr-only">Person | WatchedThis</h1>
      <PersonPageClient id={id} />
    </>
  );
}
