"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

type ThemeToggleProps = {
  size?: "sm" | "md" | "lg";
};

export default function ThemeToggle({ size = "md" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizes = {
    sm: {
      container: "h-6 w-12",
      thumb: "h-5 w-5",
      icon: "h-3 w-3",
      translate: "translate-x-6",
    },
    md: {
      container: "h-8 w-14",
      thumb: "h-7 w-7",
      icon: "h-4 w-4",
      translate: "translate-x-6",
    },
    lg: {
      container: "h-10 w-16",
      thumb: "h-9 w-9",
      icon: "h-5 w-5",
      translate: "translate-x-7",
    },
  };

  const s = sizes[size];
  const isDark = theme === "dark";

  if (!mounted) {
    return (
      <div
        className={`${s.container} rounded-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border animate-pulse`}
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`
        relative flex items-center ${s.container} rounded-full p-0.5
        transition-colors duration-300
        ${
          isDark
            ? "bg-dark-card border border-dark-border"
            : "bg-light-card border border-light-border"
        }
        hover:border-light-accent dark:hover:border-dark-accent
        focus:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent
      `}
    >
      {/* Track icons — sun on left, moon on right */}
      <span
        style={{ marginTop: 0 }}
        className={`absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-300 ${isDark ? "opacity-30" : "opacity-0"}`}
      >
        <SunIcon className={`${s.icon} text-light-disabled`} />
      </span>
      <span
        style={{ marginTop: 0 }}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-300 ${isDark ? "opacity-0" : "opacity-30"}`}
      >
        <MoonIcon className={`${s.icon} text-light-secondary-text`} />
      </span>

      {/* Sliding thumb */}
      <div
        className={`
          relative flex items-center justify-center
          ${s.thumb} rounded-full
          transform transition-all duration-300 ease-in-out
          shadow-sm
          ${
            isDark
              ? `${s.translate} bg-dark-accent`
              : "translate-x-0 bg-light-accent"
          }
        `}
      >
        {isDark ? (
          <MoonIcon className={`${s.icon} text-white`} />
        ) : (
          <SunIcon className={`${s.icon} text-white`} />
        )}
      </div>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
}
