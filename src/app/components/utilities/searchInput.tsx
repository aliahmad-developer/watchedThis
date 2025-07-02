"use client";
import { FormEvent, ChangeEvent } from "react";

interface SearchInputProps {
  searchQuery: string;
  onSearchSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export default function SearchInput({
  searchQuery,
  onSearchSubmit,
  onInputChange,
  className = "",
}: SearchInputProps) {
  return (
    <div className={`w-full bg-light-card dark:bg-dark-card p-4 shadow-md border-t border-light-border dark:border-dark-border ${className}`}>
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={onInputChange}
          className={`
            flex-1 p-2 rounded-lg 
            border border-light-border dark:border-dark-border 
            bg-light-bg dark:bg-dark-bg 
            text-light-body-text dark:text-dark-body-text
            placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text
            focus:outline-none
            transition-colors duration-200
          `}
          placeholder="Search..."
          autoFocus
        />
        <button
          type="submit"
          className={`
            px-4 py-2 rounded-lg 
            bg-light-btn-bg dark:bg-dark-btn-bg 
            text-light-btn-text dark:text-dark-btn-text
            hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg
            focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent
            transition-colors duration-200
          `}
        >
          Search
        </button>
      </form>
    </div>
  );
}