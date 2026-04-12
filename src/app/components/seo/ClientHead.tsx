"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ClientHeadContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canonicalUrl = `https://watchedthis.com${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WatchedThis",
    url: "https://watchedthis.com",
    logo: "https://watchedthis.com/og-default.png",
    description: "AI-powered movie and TV show discovery platform",
    knowsAbout: ["movies", "TV shows", "film discovery", "scene detection"]
  };

  return (
    <>
      <link rel="canonical" href={canonicalUrl} />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} 
      />
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-7RZRTNDZRV"></script>
      <script 
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7RZRTNDZRV');
          `
        }} 
      />
    </>
  );
}

export default function ClientHead() {
  return (
    <Suspense fallback={null}>
      <ClientHeadContent />
    </Suspense>
  );
}
