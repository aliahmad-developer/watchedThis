"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import DiceRoll from "./diceRoll";

interface Props {
  children: React.ReactNode;
  mediaTitle: string;
  initialLoad?: boolean;
  prefetchedData?: any;
}

export default function RandomMediaShell({ 
  children, 
  mediaTitle, 
  initialLoad = false 
}: Props) {
  const [showLoader, setShowLoader] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isFirstRender = useRef(true);
  const isInitialLoadRef = useRef(initialLoad);

  // Scroll to top on every new media item
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mediaTitle]);

  // Skip dice on /random direct load, show only on route changes/rerolls
  useEffect(() => {
    // Skip if initial load from /random prefetch
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // Skip first render (hydration)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Show dice for navigation/reroll
    setShowLoader(true);
    setFinishing(false);

    const finishTimer = setTimeout(() => setFinishing(true), 600);
    const hideTimer = setTimeout(() => setShowLoader(false), 1000);

    return () => {
      clearTimeout(finishTimer);
      clearTimeout(hideTimer);
    };
  }, [pathname, searchParams]);

  // Handle body overflow
  useEffect(() => {
    if (showLoader) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showLoader]);

  if (showLoader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <DiceRoll finishing={finishing} />
      </div>
    );
  }

  return <>{children}</>;
}