"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface DetailsClientShellProps {
  mediaType: string;
  currentSlug: string;
  expectedSlug: string;
  id: string;
  children: React.ReactNode;
}

export default function DetailsClientShell({
  mediaType,
  currentSlug,
  expectedSlug,
  id,
  children,
}: DetailsClientShellProps) {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (currentSlug !== expectedSlug) {
      router.replace(`/${mediaType}/${expectedSlug}/${id}`);
    }
  }, [mediaType, currentSlug, expectedSlug, id, router]);

  return <>{children}</>;
}