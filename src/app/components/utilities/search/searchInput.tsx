"use client";
import { useState } from "react";
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
  const [clicked, setClicked] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearchSubmit(e);
    setClicked(true);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setClicked(false);
    onInputChange(e);
  };

  return (
    <div
      className={`w-full bg-light-card dark:bg-dark-card p-4 shadow-md border-t border-light-border dark:border-dark-border rounded-lg ${className}`}
    >
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={clicked ? "" : searchQuery}
          onChange={handleInputChange}
          className="flex-1 p-2 rounded-lg 
            border border-light-border dark:border-dark-border 
            bg-light-bg dark:bg-dark-bg 
            text-light-body-text dark:text-dark-body-text
            placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text
            focus:outline-none"
          placeholder="Search..."
          aria-label="Search input"
          autoFocus
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg 
            bg-light-btn-bg dark:bg-dark-btn-bg 
            text-light-btn-text dark:text-dark-btn-text
            hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg
            focus:outline-none"
        >
          Search
        </button>
      </form>
    </div>
  );
}