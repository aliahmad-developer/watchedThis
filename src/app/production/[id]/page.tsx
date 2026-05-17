import { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import ProductionPageClient from "./pageClient";

// ─── Constants ────────────────────────────────────────────────────────────────

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://watchedthis.com"
).replace(/\/$/, "");

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetchCompany = async (id: string) => {
  const res = await fetch(
    `${APP_URL}/api/production/${id}?mediaType=movie&page=1`,
    {
      next: { revalidate: 3600 },
    },
  );

  if (!res.ok) return null;
  return res.json();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProxyUrl(path: string, size = "w500") {
  return `${APP_URL}/api/image-proxy/?url=${encodeURIComponent(
    `https://image.tmdb.org/t/p/${size}${path}`,
  )}`;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const data = await fetchCompany(id);

  if (!data?.company) {
    return {
      title: "Production Company | WatchedThis",
      robots: { index: false, follow: false },
    };
  }

  const name = data.company.name || "Production Company";
  const country = data.company.origin_country
    ? ` (${data.company.origin_country})`
    : "";
  const description = `Explore movies and TV shows produced by ${name}${country}. Browse their catalog, productions, and filmography on WatchedThis.`;

  // Logo images are typically square or landscape. w500 is a safe size.
  const ogImage = data.company.logo_path
    ? buildProxyUrl(data.company.logo_path, "w500")
    : undefined;

  return {
    metadataBase: new URL(APP_URL),
    title: `${name} | Production Company | WatchedThis`,
    description,
    keywords: [
      `${name} movies`,
      `${name} tv shows`,
      `${name} productions`,
      `${name} filmography`,
      "production company movies",
      "movie studio catalog",
      "movies by production company",
      "tv shows by production company",
    ],
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${APP_URL}/production/${id}`,
    },
    openGraph: {
      title: `${name} | Production Company | WatchedThis`,
      description,
      url: `${APP_URL}/production/${id}`,
      siteName: "WatchedThis",
      type: "article",
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 500,
              height: 500,
              alt: `${name} — WatchedThis`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Production Company | WatchedThis`,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

function ProductionSchema({
  name,
  id,
  logo,
}: {
  name: string;
  id: string;
  logo?: string | null;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: `${APP_URL}/production/${id}`,
    ...(logo && {
      logo: buildProxyUrl(logo, "w500"),
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      key="production-schema"
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await fetchCompany(id);

  const company = data?.company || null;
  const name = company?.name || "Production Company";

  return (
    <>
      <h1 className="sr-only">
        {name} Movies and TV Shows – Production Company Catalog
      </h1>

      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Productions", href: "/production" },
          { name, href: `/production/${id}` },
        ]}
      />

      <ProductionPageClient id={id} />

      {company && (
        <ProductionSchema id={id} name={name} logo={company.logo_path} />
      )}
    </>
  );
}
