"use client";
import { useState, FormEvent, ChangeEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";

interface SearchInputProps {
  searchQuery: string;
  onSearchSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  clearInput?: () => void;
  showClearButton?: boolean;
}

export default function SearchInput({
  searchQuery,
  onSearchSubmit,
  onInputChange,
  clearInput,
  className = "",
  showClearButton = true,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    if (clearInput) {
      clearInput();
    }
  };

  return (
    <form
      onSubmit={onSearchSubmit}  // Use the prop directly
      className={`relative flex items-center w-full ${className}`}
    >
      <div className="relative flex-1 flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={onInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required
          className="w-full p-3 md:p-3.5 rounded-lg 
            border border-light-border dark:border-dark-border 
            bg-light-bg dark:bg-dark-bg 
            text-light-body-text dark:text-dark-body-text
            placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text
            focus:outline-none
            pr-10"
          placeholder="Search movies, TV shows..."
          aria-label="Search input"
          autoFocus
        />
        <button
          type="submit"
          aria-label="Search"
          className="text-2xl bg-transparent absolute right-3 text-lg text-light-secondary-text dark:text-dark-secondary-text"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>

      {showClearButton && searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="bg-transparent absolute right-10 md:right-12 p-1 text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text"
        >
          <FontAwesomeIcon icon={faTimes} className="text-base" />
        </button>
      )}
    </form>
  );
}