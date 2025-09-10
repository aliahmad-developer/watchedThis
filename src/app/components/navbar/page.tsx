"use client";

import { usePathname, useRouter } from "next/navigation";
import AuthButton from "../../components/auth/navButton/authButton";
import { useState, useEffect, FormEvent, ChangeEvent, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShuffle,
  faSpinner,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Toggle from "../utilities/toggle";
import SearchInput from "../utilities/search/searchInput";
import SearchButton from "../utilities/search/searchButton";
import SearchResultsDropdown from "../utilities/search/searchResultsDropdown";
import { MediaResult } from "../utilities/search/searchInput";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Route change reset
  useEffect(() => {
    setSearchVisible(false);
    setSearchQuery("");
    setSearchResults([]);
  }, [pathname]);

  // Mount + prefetch
  useEffect(() => {
    setHasMounted(true);
    router.prefetch("/search");
    router.prefetch("/random");
    router.prefetch("/spinner");
    router.prefetch("/find");
  }, [router]);

  // Debounced search
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearchLoading(true);
      try {
        const res = await fetch(
          `/api/search?query=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : [];
        setSearchResults(list.slice(0, 5));
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchToggle = () => {
    setSearchVisible((prev) => !prev);
    if (!searchVisible) {
      setSearchQuery("");
      setSearchResults([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setSearchQuery("");
      setSearchVisible(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearInput = () => {
    setSearchQuery("");
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const handleRandomClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(`/random?ts=${Date.now()}`);
  };

  const handleCloseDropdown = () => {
    setIsFocused(false);
  };

  const navItems = [
    { label: "Random", icon: faShuffle, href: "/random" },
    { label: "Spinner", icon: faSpinner, href: "/spinner" },
    { label: "Find", icon: faMagnifyingGlass, href: "/find" },
  ];

  return (
    <>
      <nav className="w-full bg-light-nav dark:bg-dark-nav px-4 py-2 top-0 z-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <Link
              href="/"
              className="text-lg font-bold text-dark-accent whitespace-nowrap"
            >
              RandoMovie
            </Link>
            <div className="flex items-center gap-2 sm:hidden">
              <SearchButton
                isActive={searchVisible}
                onClick={handleSearchToggle}
                size="sm"
              />
              <Toggle size="sm" />
              <AuthButton /> 
            </div>
          </div>

          <div className="hidden sm:block w-full sm:w-[60%] md:w-[40%] min-w-[260px]">
            <div className="flex justify-evenly items-center gap-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg py-1 px-2 shadow-sm text-xs sm:text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) =>
                    item.label === "Random" && handleRandomClick(e)
                  }
                  className={`flex flex-col items-center justify-center font-medium transition-colors duration-200 ${
                    pathname === item.href
                      ? "text-light-accent dark:text-dark-accent"
                      : "text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="h-3 mb-0.5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <SearchButton
              isActive={searchVisible}
              onClick={handleSearchToggle}
              size="sm"
            />
            <Toggle size="sm" />
            <AuthButton />
          </div>
        </div>
      </nav>

      {/* Search Input */}
      {hasMounted && searchVisible && (
        <div className="absolute left-0 right-0 top-14 z-40 bg-light-nav dark:bg-dark-nav shadow-md px-4 py-2 border-t border-light-border dark:border-dark-border">
          <div className="relative w-full">
            <SearchInput
              clearInput={handleClearInput}
              searchQuery={searchQuery}
              onSearchSubmit={handleSearchSubmit}
              onInputChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="w-full text-sm"
              inputRef={(el) => {
                inputRef.current = el;
                if (el) el.focus();
              }}
            />
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {searchVisible && isFocused && searchQuery.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-[104px] sm:top-[120px] z-40 px-4"
        >
          <SearchResultsDropdown
            results={searchResults}
            searchQuery={searchQuery}
            isLoading={isSearchLoading}
            onClose={handleCloseDropdown}
          />
        </div>
      )}
    </>
  );
}
