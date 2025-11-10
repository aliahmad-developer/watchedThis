"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const start = window.scrollY;
    const startTime = performance.now();
    const duration = 800;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      window.scrollTo(0, start * (1 - easedProgress));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`p-3 rounded-full bg-gray-800/70 text-white shadow-lg hover:bg-gray-700/80 transition-all duration-300 focus:outline-none dark:bg-gray-600/60 dark:hover:bg-gray-500/70 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
      >
        {" "}
        <FontAwesomeIcon icon={faAngleUp} className="h-5 w-5" />{" "}
      </button>{" "}
    </div>
  );
}
