import { Metadata } from "next";
import PersonPageClient from "./PersonPageClient";

const fetchPerson = async (id: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/person/${id}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPerson(id);

  if (!data) return { title: "Person Not Found | WatchedThis" };

  const name = data.name || "Unknown Person";
  const description = data.biography
    ? `${data.biography.substring(0, 155)}...`
    : `Discover movies and TV shows featuring ${name} on WatchedThis.`;

  return {
    title: `${name} | WatchedThis`,
    description,
    alternates: {
      canonical: `https://watchedthis.com/person/${id}`,
    },
    openGraph: {
      title: `${name} | WatchedThis`,
      description,
      images: data.profile_path
        ? [
            {
              url: `https://image.tmdb.org/t/p/w500${data.profile_path}`,
              width: 500,
              height: 750,
              alt: `${name} profile photo`,
            },
          ]
        : [{ url: "/og-default.png", width: 1200, height: 630, alt: "WatchedThis" }],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | WatchedThis`,
      description,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchPerson(id);
  const name = data?.name || 'Person';
  return <>
    <h1 className="sr-only">{name} | WatchedThis</h1>
    <PersonPageClient id={id} />
  </>;
}
