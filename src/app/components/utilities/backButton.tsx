"use client";
import { useRouter, usePathname } from "next/navigation";

interface BackButtonProps {
  className?: string;
}

const HIDDEN_ON = ["/", "/find", "/random", "/spinner"];

export default function BackButton({ className }: BackButtonProps) {
  const router   = useRouter();
  const pathname = usePathname();

  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className={[
        "flex items-center justify-center",
        "w-11 h-11 sm:w-12 sm:h-12",
        "rounded-full",
        "bg-light-disabled dark:bg-dark-disabled",
        "border border-light-border dark:border-dark-border",
        "text-light-secondary-text dark:text-dark-btn-text",
        "hover:text-light-btn-hover-text dark:hover:text-dark-btn-hover-text",
        "hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg",
        "hover:scale-110 active:scale-95",
        "shadow-sm hover:shadow-md",
        "transition-all duration-200",
        className ?? "",
      ].join(" ")}
    >
      <svg
        className="w-5 h-5 sm:w-6 sm:h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 14L4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </svg>
    </button>
  );
}