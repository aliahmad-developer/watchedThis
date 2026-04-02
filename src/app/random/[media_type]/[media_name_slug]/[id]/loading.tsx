"use client";

import { useEffect } from "react";
import DiceRoll from "./diceRoll";

export default function RandomLoading() {
  useEffect(() => {
    // Prevent scrolling when component mounts
    document.body.style.overflow = "hidden";
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg pt-20">
      <DiceRoll finishing={false} />
    </div>
  );
}