import { Metadata } from "next";
import ProductionPageClient from "./pageClient";

const fetchCompany = async (id: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/company/${id}?mediaType=movie&page=1`, {
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
  const data = await fetchCompany(id);

  if (!data?.company) return { title: "Production Company | WatchedThis" };

  const name = data.company.name || "Production Company";
  const country = data.company.origin_country
    ? ` (${data.company.origin_country})`
    : "";
  const description = `Explore all movies and TV shows by ${name}${country}. Browse their full catalog on WatchedThis.`;

  return {
    title: `${name} | Production Company | WatchedThis`,
    description,
    alternates: {
      canonical: `https://watchedthis.com/production/${id}`,
    },
    openGraph: {
      title: `${name} | WatchedThis`,
      description,
      images: data.company.logo_path
        ? [
            {
              url: `https://image.tmdb.org/t/p/w300${data.company.logo_path}`,
              width: 300,
              height: 300,
              alt: `${name} logo`,
            },
          ]
        : [{ url: "/og-default.png", width: 1200, height: 630, alt: "WatchedThis" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Production Company | WatchedThis`,
      description,
    },
  };
}

// ✅ Next.js pages always receive `params`, not `id` directly
export default async function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchCompany(id);
  const name = data?.company?.name || 'Production Company';
  return <>
    <h1 className="sr-only">{name} | Production Company | WatchedThis</h1>
    <ProductionPageClient id={id} />
  </>;
}
