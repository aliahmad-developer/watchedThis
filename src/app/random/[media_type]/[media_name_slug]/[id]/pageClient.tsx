"use client";

import { useState, useEffect } from "react";
import DiceRoll from "./diceRoll";

interface Props {
  children: React.ReactNode;
  mediaTitle: string;
}

export default function RandomMediaShell({ children, mediaTitle }: Props) {
  const [showLoader, setShowLoader] = useState(true);
  const [finishing, setFinishing] = useState(false);

  // Scroll to top on every new media item
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mediaTitle]);

  // Brief dice animation on mount — purely cosmetic, not tied to any fetch
  useEffect(() => {
    const finishTimer = setTimeout(() => setFinishing(true), 600);
    const hideTimer = setTimeout(() => setShowLoader(false), 1000);
    return () => {
      clearTimeout(finishTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (showLoader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <DiceRoll finishing={finishing} />
      </div>
    );
  }

  return <>{children}</>;
}
