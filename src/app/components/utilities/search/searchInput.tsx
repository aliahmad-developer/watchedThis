"use client";
import { useState, FormEvent, ChangeEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

interface SearchInputProps {
  searchQuery: string;
  onSearchSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  clearInput?: () => void;
}

export default function SearchInput({
  searchQuery,
  onSearchSubmit,
  onInputChange,
  clearInput,
  className = "",
}: SearchInputProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearInput?.();
    onSearchSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-2 items-center w-full ${className}`}
    >
      <input
      
        type="text"
        value={searchQuery}
        onChange={onInputChange}
        required
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

      <button type="submit" aria-label="Search" className="text-2xl bg-transparent">
        <FontAwesomeIcon icon={faSearch} />
      </button>
    </form>
  );
}
