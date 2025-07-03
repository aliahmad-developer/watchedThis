"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faShuffle,
  faSpinner,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Toggle from "../utilities/toggle";
import SearchInput from "../utilities/search/searchInput";
import SearchButton from "../utilities/search/searchButton";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const navItems = [
    { label: "Random", icon: faShuffle, href: "/random" },
    { label: "Spinner", icon: faSpinner, href: "/spinner" },
    { label: "Find", icon: faMagnifyingGlass, href: "/find" },
  ];

  const handleSearchToggle = () => setSearchVisible((prev) => !prev);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchVisible(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);

  const handleRandomClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = "/random";
  };

  return (
    <nav className="w-full bg-light-nav dark:bg-dark-nav shadow-md px-4 py-3 z-50 transition-all duration-300">
      {/* Top Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Logo + mobile search/toggle */}
        <div className="flex justify-between w-full sm:w-auto items-center">
          <Link
            href="/"
            className="p-1 text-2xl font-bold text-dark-accent whitespace-nowrap"
          >
            RandoMovie
          </Link>
          <div className="flex sm:hidden items-center gap-3">
            <SearchButton
              isActive={searchVisible}
              onClick={handleSearchToggle}
              className="text-base text-light-body-text dark:text-dark-body-text hover:text-light-accent dark:hover:text-dark-accent"
            />
            <Toggle />
          </div>
        </div>

        {/* Middle: Nav links */}
        <div className="w-full sm:w-[60%] md:w-[40%] min-w-[260px]">
          <div className="flex justify-evenly items-center gap-x-4 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl py-2 px-3 shadow-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => item.label === "Random" && handleRandomClick(e)}
                className={`flex flex-col items-center justify-center text-xs sm:text-sm md:text-base font-medium transition-colors duration-200 px-1 sm:px-2 ${
                  pathname === item.href
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Desktop search + toggle */}
        <div className="hidden sm:flex items-center gap-4">
          <SearchButton
            isActive={searchVisible}
            onClick={handleSearchToggle}
            className="text-lg text-light-body-text dark:text-dark-body-text hover:text-light-accent dark:hover:text-dark-accent"
          />
          <Toggle />
        </div>
      </div>

      {/* Bottom Row: Search bar */}
      {hasMounted && (
        <div
          className={`transition-all transform-gpu duration-300 ease-in-out overflow-hidden origin-top ${
            searchVisible
              ? "opacity-100 scale-y-100 h-auto py-2"
              : "opacity-0 scale-y-0 h-0 py-0"
          }`}
        >
          <SearchInput
            searchQuery={searchQuery}
            onSearchSubmit={handleSearchSubmit}
            onInputChange={handleInputChange}
            className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md text-light-body-text dark:text-dark-body-text text-sm"
          />
        </div>
      )}
    </nav>
  );
}