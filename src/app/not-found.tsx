"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const FILM_QUOTES = [
  "The reel has run out.",
  "This scene was left on the cutting room floor.",
  "Nothing to see here. Roll credits.",
  "Even the best films have missing frames.",
];

export default function NotFound() {
  const [quote, setQuote] = useState("");
  const [visible, setVisible] = useState(false);
  const [navHeight, setNavHeight] = useState(64);

  useEffect(() => {
    setQuote(FILM_QUOTES[Math.floor(Math.random() * FILM_QUOTES.length)]);
    const t = setTimeout(() => setVisible(true), 50);
    document.documentElement.dataset.page = "404";

    // Measure the actual nav so the overlay starts exactly below it
    const nav =
      document.querySelector("nav") ??
      document.querySelector("header") ??
      document.querySelector("[data-navbar]");
    if (nav) setNavHeight(nav.getBoundingClientRect().height);

    return () => {
      clearTimeout(t);
      delete document.documentElement.dataset.page;
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-between overflow-hidden"
      style={{ top: navHeight }}
    >
      {/* Ambient glow — light */}
      <div
        className="dark:hidden pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(173,133,141,0.25) 0%, transparent 70%)",
        }}
      />
      {/* Ambient glow — dark */}
      <div
        className="hidden dark:block pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(212,163,115,0.2) 0%, transparent 70%)",
        }}
      />

      <FilmStrip />

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col items-center text-center gap-3 px-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        {/* 404 */}
        <div className="relative select-none leading-none">
          <span
            className="text-[clamp(4.5rem,15vw,9rem)] font-black leading-none tracking-tighter text-light-disabled dark:text-dark-border"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            404
          </span>
          <span
            className="absolute inset-0 text-[clamp(4.5rem,15vw,9rem)] font-black leading-none tracking-tighter text-light-accent dark:text-dark-accent blur-[1px] opacity-40 dark:opacity-50"
            aria-hidden
          >
            404
          </span>
          <span
            className="absolute inset-0 text-[clamp(4.5rem,15vw,9rem)] font-black leading-none tracking-tighter text-light-accent dark:text-dark-accent opacity-20 dark:opacity-35"
            aria-hidden
          >
            404
          </span>
          <div
            className="absolute left-0 right-0 bg-light-accent dark:bg-dark-accent opacity-60"
            style={{ top: "52%", height: "2px", transform: "rotate(-1.5deg)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px w-10 bg-light-accent dark:bg-dark-accent opacity-60" />
          <span className="font-irish-grover text-xs uppercase tracking-[0.22em] text-light-accent dark:text-dark-accent font-semibold">
            Scene Not Found
          </span>
          <div className="h-px w-10 bg-light-accent dark:bg-dark-accent opacity-60" />
        </div>

        <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm max-w-xs leading-relaxed italic font-irish-grover">
          "{quote}"
        </p>

        <Link
          href="/"
          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            bg-light-btn-bg dark:bg-dark-btn-bg
            text-light-btn-text dark:text-dark-btn-text
            hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg
            hover:shadow-lg active:scale-95"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Home
        </Link>
      </div>

      <FilmStrip flip />

      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-20 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}

function FilmStrip({ flip = false }: { flip?: boolean }) {
  const holes = Array.from({ length: 20 });
  const frames = Array.from({ length: 6 });
  const stripBg = "var(--strip-bg)";
  const holeBg = "var(--hole-bg)";

  return (
    <div
      className="w-full flex flex-col select-none shrink-0 text-shadow-light-disabled"
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
      aria-hidden
    >
      <div
        className="flex items-center gap-2 px-3 py-0.75"
        style={{ background: stripBg }}
      >
        {holes.map((_, i) => (
          <div
            key={i}
            className="w-3 shrink-0 rounded-sm"
            style={{ height: "8px", background: holeBg }}
          />
        ))}
      </div>
      <div
        className="flex gap-0.5 px-3"
        style={{ background: stripBg, paddingTop: 4, paddingBottom: 4 }}
      >
        {frames.map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              aspectRatio: "16/9",
              maxHeight: "36px",
              background: holeBg,
            }}
          />
        ))}
      </div>
      <div
        className="flex items-center gap-2 px-3 py-0.75"
        style={{ background: stripBg }}
      >
        {holes.map((_, i) => (
          <div
            key={i}
            className="w-3 shrink-0 rounded-sm"
            style={{ height: "8px", background: holeBg }}
          />
        ))}
      </div>
    </div>
  );
}
