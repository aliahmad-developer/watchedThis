"use client";

import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  mediaTitle: string;
  initialLoad?: boolean;
  prefetchedData?: any;
}

export default function RandomMediaShell({ children, mediaTitle }: Props) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mediaTitle]);

  return <>{children}</>;
}