import { Metadata } from "next";
import PersonPageClient from "./PersonPageClient";
import { fetchPerson } from "@/lib/fetchPerson";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const data = await fetchPerson(id);
    if (!data?.details) return { title: "Person Not Found | WatchedThis" };

    const name = data.details.name || "Unknown Person";
    const description = data.details.biography
      ? `${data.details.biography.substring(0, 155)}...`
      : `Discover movies and TV shows featuring ${name} on WatchedThis.`;

    const ogUrl = new URL("/og", "https://watchedthis.com");
    ogUrl.searchParams.set("title", name);
    ogUrl.searchParams.set("subtitle", description);
    if (data.details.profile_path)
      ogUrl.searchParams.set("poster", data.details.profile_path);

    return {
      title: `${name} | WatchedThis`,
      description,
      alternates: {
        canonical: `https://watchedthis.com/person/${id}`,
      },
      openGraph: {
        title: `${name} | WatchedThis`,
        description,
        type: "profile",
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
    return { title: "Person | WatchedThis" };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchPerson(id);
  const name = data?.details?.name || "Person";

  return (
    <>
      <h1 className="sr-only">{name} | WatchedThis</h1>
      <PersonPageClient id={id} />
    </>
  );
}