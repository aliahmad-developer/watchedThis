"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

interface SearchButtonProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function SearchButton({ 
  isActive, 
  onClick, 
  className = "", 
  size = "md" 
}: SearchButtonProps) {
  // Size configuration
  const sizeClasses = {
    sm: {
      button: "p-2",
      icon: "lg",
    },
    md: {
      button: "p-2.5",
      icon: "2xl",
    },
    lg: {
      button: "p-3",
      icon: "3xl",
    },
  };

  return (
    <button 
      onClick={onClick}
      className={`
        rounded-full transition-all duration-200 ease-in-out
        ${isActive 
          ? "bg-light-accent/10 dark:bg-dark-accent/10" 
          : "bg-transparent hover:bg-light-hover dark:hover:bg-dark-hover"
        }
        ${sizeClasses[size].button}
        ${className}
        border-none
        cursor-pointer
        focus:outline-none
      `}
      aria-label={isActive ? "Close search" : "Open search"}
    >
      <FontAwesomeIcon 
        icon={faSearch} 
        size={sizeClasses[size].icon as any}
        className={`
          transition-colors duration-200 ease-in-out
          ${isActive 
            ? "text-light-accent dark:text-dark-accent" 
            : "text-light-secondary-text dark:text-dark-secondary-text"
          }
        `} 
      />
    </button>
  );
}