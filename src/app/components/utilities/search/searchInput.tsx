"use client";

import { FormEvent, ChangeEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";

export interface MediaResult {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  original_name?: string;
  overview?: string;
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
          className="w-full p-3 md:p-3.5 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent pr-10 transition-colors"
          placeholder="Search movies, TV shows..."
          aria-label="Search input"
        />

        {/* Clear button — only when there's input */}
        {showClearButton && searchQuery && (
          <button
            type="button"
            onClick={clearInput}
            aria-label="Clear search"
            className="absolute right-12 p-1 bg-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-3 bg-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>
    </form>
  );
}