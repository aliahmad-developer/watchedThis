import { Metadata } from "next";
import ProductionPageClient from "./pageClient";

const fetchCompany = async (id: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/company/${id}?mediaType=movie&page=1`,
    {
      next: { revalidate: 3600 },
    },
  );
  if (!res.ok) return null;
  return res.json();
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchCompany(id);

  if (!data?.company) return { title: "Production Company | WatchedThis" };

  const name = data.company.name || "Production Company";
  const country = data.company.origin_country
    ? ` (${data.company.origin_country})`
    : "";
  const description = `Explore all movies and TV shows by ${name}${country}. Browse their full catalog on WatchedThis.`;

  const ogUrl = new URL("/og", "https://watchedthis.com");
  ogUrl.searchParams.set("title", name);
  ogUrl.searchParams.set("subtitle", description);
  if (data.company.logo_path)
    ogUrl.searchParams.set("logo", data.company.logo_path);

  return {
    title: `${name} | Production Company | WatchedThis`,
    description,
    alternates: {
      canonical: `https://watchedthis.com/production/${id}`,
    },
    openGraph: {
      title: `${name} | WatchedThis`,
      description,
      type: "website",
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
      title: `${name} | Production Company | WatchedThis`,
      description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchCompany(id);
  const name = data?.company?.name || "Production Company";
  return (
    <>
      <h1 className="sr-only">{name} | Production Company | WatchedThis</h1>
      <ProductionPageClient id={id} />
    </>
  );
}
