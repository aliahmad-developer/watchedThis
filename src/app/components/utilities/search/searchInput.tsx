/* --- Updated SearchInput.tsx --- */
"use client";

import {
  FormEvent,
  ChangeEvent,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";

export interface MediaResult {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  original_name?: string;
  release_date?: string;
  poster_path?: string;
  runtime?: number;
}

interface SearchInputProps {
  searchQuery: string;
  onSearchSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  clearInput?: () => void;
  showClearButton?: boolean;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}

export default function SearchInput({
  searchQuery,
  onSearchSubmit,
  onInputChange,
  clearInput,
  className = "",
  showClearButton = true,
  onFocus,
  onBlur,
  inputRef,
}: SearchInputProps) {
  return (
    <form
      onSubmit={onSearchSubmit}
      className={`relative flex items-center w-full ${className}`}
    >
      <div className="relative flex-1 flex items-center">
        <input
          ref={inputRef || undefined}
          type="text"
          value={searchQuery}
          onChange={onInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          required
          className="w-full p-3 md:p-3.5 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text focus:outline-none pr-10"
          placeholder="Search movies, TV shows..."
          aria-label="Search input"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-3 text-lg text-black  dark:text-white bg-transparent hover:text-light-accent dark:hover:text-dark-accent"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>

      {showClearButton && searchQuery && (
        <button
          type="button"
          onClick={clearInput}
          aria-label="Clear search"
          className="absolute right-10 md:right-12 p-1 text-black dark:text-white bg-transparent hover:text-gray-400"
        >
          <FontAwesomeIcon icon={faTimes} className="text-base" />
        </button>
      )}
    </form>
  );
}