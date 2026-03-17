"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPatreon } from "@fortawesome/free-brands-svg-icons";
import { faHashtag } from "@fortawesome/free-solid-svg-icons";
import { animate } from "animejs";

// Spread stars across the full card width, not just top-right corner
const STARS = [
  { top: 10, right: 40, delay: "0s", duration: "2.2s" },
  { top: 0, right: 160, delay: "0.4s", duration: "3.1s" },
  { top: 60, right: 20, delay: "0.8s", duration: "1.8s" },
  { top: 5, right: 280, delay: "1.1s", duration: "2.6s" },
  { top: 0, right: 420, delay: "0.3s", duration: "1.9s" },
  { top: 90, right: 10, delay: "1.5s", duration: "2.4s" },
  { top: 0, right: 560, delay: "0.9s", duration: "3.3s" },
  { top: 20, right: 700, delay: "1.7s", duration: "2.0s" },
  { top: 0, right: 850, delay: "0.6s", duration: "2.8s" },
  { top: 35, right: 980, delay: "2.1s", duration: "1.6s" },
];

export default function Membership() {
  const [is404, setIs404] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const animationsRef = useRef<ReturnType<typeof animate>[]>([]);

  useEffect(() => {
    const check = () =>
      setIs404(document.documentElement.dataset.page === "404");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-page"],
    });
    return () => observer.disconnect();
  }, []);

  /* ── entrance + pulse animations ── */
  useEffect(() => {
    if (!cardRef.current || !btnRef.current) return;

    const entrance = animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 900,
      easing: "easeOutExpo",
    });

    const btnEntrance = animate(btnRef.current, {
      scale: [0.85, 1],
      opacity: [0, 1],
      delay: 300,
      duration: 700,
      easing: "easeOutBack",
    });

    const pulse = animate(btnRef.current, {
      scale: [1, 1.04, 1],
      duration: 2200,
      easing: "easeInOutSine",
      loop: true,
      delay: 1100,
    });

    animationsRef.current = [entrance, btnEntrance, pulse];

    return () => {
      animationsRef.current.forEach((a) => a.pause?.());
    };
  }, []);

  if (is404) return null;

  return (
    <section
      ref={cardRef}
      className="
        membership-card
        relative w-full max-w-5xl mx-auto
        flex flex-col md:flex-row items-center justify-between
        gap-8 p-8 cursor-default
        bg-light-card dark:bg-dark-card
        text-light-body-text dark:text-dark-body-text
        border border-light-border dark:border-dark-border
        rounded-2xl shadow-md
        transition-colors duration-300 overflow-hidden
      "
    >
      {/* Stars — purely decorative, hidden from screen readers */}
      <div aria-hidden="true">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="star-dot pointer-events-none"
            style={{
              top: `${star.top}px`,
              right: `${star.right}px`,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>

      {/* Left content */}
      <div className="flex-1 text-center md:text-left relative z-10">
        <div className="flex items-center gap-2 mb-6 px-1">
          <FontAwesomeIcon
            icon={faHashtag}
            className="text-light-accent dark:text-dark-accent ml-1"
            style={{ width: "1.5rem", height: "1.5rem" }}
          />
          <h2>Support RandoMovie</h2>
        </div>
        <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm sm:text-base leading-relaxed max-w-md mx-auto md:mx-0">
          You're a visitor, not a customer. If you'd like to help keep{" "}
          <span className="font-semibold text-light-accent dark:text-dark-accent inline">
            RandoMovie
          </span>{" "}
          running and growing, consider supporting my work.
        </p>
      </div>

      {/* CTA Button */}
      <div className="flex-1 flex justify-center md:justify-end relative z-10">
        <Link
          ref={btnRef}
          href="https://www.patreon.com/c/randomovieorg/membership"
          target="_blank"
          rel="noopener noreferrer"
          className="
          inline-flex items-center gap-3
          px-6 py-3 rounded-full
          bg-light-accent dark:bg-dark-accent
          text-white font-semibold shadow-lg
          transition-all duration-200 ease-out
          hover:scale-105 hover:shadow-2xl
          active:scale-95
          "
        >
          <FontAwesomeIcon icon={faPatreon} className="w-5 h-5" />
          <span>Support on Patreon</span>
        </Link>
      </div>
    </section>
  );
}
