"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const scrollDuration = 250; // Duration in milliseconds (1 second)
    const scrollStep = -window.scrollY / (scrollDuration / 15);

    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 25);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`p-3 rounded-full bg-gray-800/70 text-white shadow-lg hover:bg-gray-700/80 transition-all duration-300
            focus:outline-none dark:bg-gray-600/60 dark:hover:bg-gray-500/70
            ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}
            transition-opacity duration-300`}
      >
        <FontAwesomeIcon icon={faAngleUp} className="h-5 w-5" />
      </button>
    </div>
  );
}
