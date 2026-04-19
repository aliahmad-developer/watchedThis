"use client";

import { useEffect } from "react";

interface DetailsClientShellProps {
  mediaType: string;
  currentSlug: string;
  expectedSlug: string;
  id: string;
  children: React.ReactNode;
}

export default function DetailsClientShell({ children }: DetailsClientShellProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <>{children}</>;
}