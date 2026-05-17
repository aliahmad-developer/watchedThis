"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHashtag } from "@fortawesome/free-solid-svg-icons";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIGITS = "0123456789".split("");

export default function AlphabetStrip() {
  const router = useRouter();

  const select = (value: string) => {
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const Chip = ({ label }: { label: string }) => {
    const isSymbol = label === "#";

    return (
      <button
        onClick={() => select(label)}
        className="
        bg-transparent
          min-w-8 h-8 px-2
          flex items-center justify-center
          rounded-md

          font-mono font-semibold
          text-[13px] md:text-[15px]

          text-light-secondary-text
          dark:text-dark-secondary-text

          hover:bg-light-card
          dark:hover:bg-dark-card

          hover:text-color-accent

          active:scale-95
          transition-all duration-150
          select-none
        "
        aria-label={`Filter by ${label}`}
      >
        {isSymbol ? (
          <FontAwesomeIcon icon={faHashtag} className="w-4 h-4 md:w-5 md:h-5" />
        ) : (
          label
        )}
      </button>
    );
  };

  return (
    <div
      className="
    mb-5
    w-fit
    max-w-full
    mx-auto

    rounded-xl
    border

    bg-light-bg
    dark:bg-dark-bg

    border-light-border
    dark:border-dark-border

    px-2 sm:px-3
    py-2.5
  "
    >
      {/* Letters */}
      <div className="flex flex-wrap gap-1 justify-center">
        {LETTERS.map((l) => (
          <Chip key={l} label={l} />
        ))}
      </div>

      {/* Divider */}
      <div className="my-2 border-t border-light-border dark:border-dark-border" />

      {/* Digits */}
      <div className="flex flex-wrap gap-1 justify-center">
        {DIGITS.map((d) => (
          <Chip key={d} label={d} />
        ))}
        <Chip label="#" />
      </div>
    </div>
  );
}
