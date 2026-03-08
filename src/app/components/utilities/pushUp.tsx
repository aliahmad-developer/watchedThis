"use client";

import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          setIsVisible(scrollY > 300);
          setProgress(docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (isScrolling) return;
    setIsScrolling(true);

    const start = window.scrollY;
    const startTime = performance.now();
    const duration = 700;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const p = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start * (1 - easeOutCubic(p)));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animateScroll);
      } else {
        setIsScrolling(false);
      }
    };

    rafRef.current = requestAnimationFrame(animateScroll);
  };

  // SVG arc for progress ring
  const size = 48;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`
          bg-transparent border-none rounded-full
          relative group flex items-center justify-center
          transition-all duration-500 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
          ${isVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
          }
        `}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Progress ring */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-white/10"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="stroke-light-accent dark:stroke-dark-accent transition-all duration-150"
          />
        </svg>

        {/* Button background */}
        <span
          className="
            absolute inset-1 rounded-full
            bg-gray-900/80 dark:bg-gray-800/80
            backdrop-blur-sm
            shadow-lg shadow-black/30
            transition-all duration-200
            group-hover:bg-gray-800/90 dark:group-hover:bg-gray-700/90
            group-hover:inset-0.75
            group-active:scale-90
          "
        />

        {/* Icon */}
        <span className="relative z-10 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faAngleUp}
            className={`
              h-4 w-4 text-white
              transition-transform duration-200
              group-hover:-translate-y-0.5
              ${isScrolling ? "animate-bounce" : ""}
            `}
          />
        </span>
      </button>
    </div>
  );
}