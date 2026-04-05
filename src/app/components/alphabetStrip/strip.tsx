"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHashtag } from "@fortawesome/free-solid-svg-icons";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIGITS  = "0123456789".split("");

export default function AlphabetStrip() {
  const router = useRouter();

  const select = (letter: string) => {
    router.push(`/search?q=${encodeURIComponent(letter)}`);
  };

  const Chip = ({ label }: { label: string }) => (
    <button
      onClick={() => select(label)}
      className="min-w-7 h-7 px-1.5 rounded-md text-sm md:text-lg font-mono font-bold
        bg-transparent text-light-secondary-text dark:text-dark-secondary-text
        hover:bg-light-card dark:hover:bg-dark-card
        hover:text-color-accent transition-all duration-150 select-none"
    >
      {label === "#"
        ? <FontAwesomeIcon icon={faHashtag} className="w-4 h-4 md:w-5 md:h-5" />
        : label
      }
    </button>
  );

  return (
    <div className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl px-2 py-2">
      <div className="flex flex-wrap gap-0.5 justify-center">
        {LETTERS.map((l) => <Chip key={l} label={l} />)}
      </div>
      <div className="border-t border-light-border dark:border-dark-border my-1.5 mx-1" />
      <div className="flex flex-wrap gap-0.5 justify-center">
        {DIGITS.map((d) => <Chip key={d} label={d} />)}
        <Chip label="#" />
      </div>
    </div>
  );
}