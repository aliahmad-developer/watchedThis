"use client";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

function ClientHeadContent() {
  const pathname = usePathname();
  const canonicalUrl = `https://watchedthis.com${pathname}`;

  return (
    <link rel="canonical" href={canonicalUrl} />
  );
}

export default function ClientHead() {
  return (
    <Suspense fallback={null}>
      <ClientHeadContent />
    </Suspense>
  );
}