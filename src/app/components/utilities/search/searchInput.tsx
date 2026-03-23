"use client";

import { FormEvent, ChangeEvent } from "react";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";

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
  // React.Ref covers useRef objects, callback refs, and null
  inputRef?: React.Ref<HTMLInputElement>;
  autoFocus?: boolean;
  placeholder?: string;
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
  autoFocus,
  placeholder = "Search movies, TV shows...",
}: SearchInputProps) {
  const showClear = showClearButton && !!searchQuery && !!clearInput;

  return (
    <form
      onSubmit={onSearchSubmit}
      className={`relative flex items-center w-full ${className}`}
    >
      {/*
        Flex row: input fills space, buttons sit to the right.
        No absolute positioning — icon positions are never magic numbers.
        pr-2 on the wrapper gives the buttons a small right margin.
      */}
      <div className="relative flex-1 flex items-center gap-1 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus-within:ring-2 focus-within:ring-light-accent dark:focus-within:ring-dark-accent transition-colors pr-2">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={onInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
          autoComplete="off"
          className="flex-1 min-w-0 p-3 md:p-3.5 bg-transparent text-light-body-text dark:text-dark-body-text placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text focus:outline-none"
          placeholder={placeholder}
          aria-label="Search input"
        />

        {/* Clear button */}
        {showClear && (
          <button
            type="button"
            onClick={clearInput}
            aria-label="Clear search"
            className="shrink-0 p-1.5 bg-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          aria-label="Submit search"
          className="shrink-0 p-1.5 bg-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </button>
      </div>
    </form>
  );
}