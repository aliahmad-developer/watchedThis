"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
interface SearchButtonProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export default function SearchButton({ isActive, onClick, className }: SearchButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`
        ${className || ''}
        p-2
        bg-transparent
        border-none
        cursor-pointer
        focus:outline-none
      `}
      aria-label={isActive ? "Close search" : "Open search"}
    >
      <FontAwesomeIcon 
        icon={faSearch} 
        size="xl"
        className={`
          transition-colors duration-200 ease-in-out
          ${isActive 
            ? "text-light-accent dark:text-dark-accent" 
            : "text-light-secondary-text hover:text-light-header dark:text-dark-secondary-text dark:hover:text-dark-body-text"
          }
        `} 
      />
    </button>
  );
}