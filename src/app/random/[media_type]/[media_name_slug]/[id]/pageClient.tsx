"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import DiceRoll from "./diceRoll";

interface Props {
  children: React.ReactNode;
  mediaTitle: string;
}

export default function RandomMediaShell({ children, mediaTitle }: Props) {
  const [showLoader, setShowLoader] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isFirstRender = useRef(true);

  // Scroll to top on every new media item
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mediaTitle]);

  // Trigger ONLY on route change (not first mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

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