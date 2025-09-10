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

  const translateClasses = {
    sm: "translate-x-6",
    md: "translate-x-6",
    lg: "translate-x-7",
  };

  // Size configuration
  const sizeClasses = {
    sm: {
      container: "h-6 w-12",
      toggle: "h-5 w-5",
      icon: "h-3 w-3",
    },
    md: {
      container: "h-8 w-14",
      toggle: "h-7 w-7",
      icon: "h-4 w-4",
    },
    lg: {
      container: "h-10 w-16",
      toggle: "h-9 w-9",
      icon: "h-5 w-5",
    },
  };

  if (!mounted) {
    return (
      <div
        className={`${sizeClasses[size].container} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse`}
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={`Toggle ${theme === "light" ? "dark" : "light"} mode`}
      className={`flex items-center ${sizeClasses[size].container} rounded-full p-0.5 transition-colors duration-300 z-50
        bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
        focus:outline-none`}
    >
      <div
        className={`flex items-center justify-center ${
          sizeClasses[size].toggle
        } rounded-full transform transition-transform duration-300
    ${
      theme === "light"
        ? "translate-x-0 bg-white"
        : `${translateClasses[size]} bg-gray-900`
    }`}
      >
        {theme === "light" ? (
          <SunIcon className={`${sizeClasses[size].icon} text-yellow-500`} />
        ) : (
          <MoonIcon className={`${sizeClasses[size].icon} text-gray-300`} />
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
