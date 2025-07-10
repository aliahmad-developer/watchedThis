"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
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
    <>
      {/* NAVBAR */}
      <nav className="w-full bg-light-nav dark:bg-dark-nav px-4 py-3 sticky top-0 z-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <Link
              href="/"
              className="text-xl font-bold text-dark-accent whitespace-nowrap"
            >
              RandoMovie
            </Link>
            <div className="flex items-center gap-3 sm:hidden">
              <SearchButton
                isActive={searchVisible}
                onClick={handleSearchToggle}
                className="text-base text-light-body-text dark:text-dark-body-text hover:text-light-accent dark:hover:text-dark-accent"
              />
              <Toggle />
            </div>
          </div>

          {/* Center Navigation - Hidden on small screens when search is visible */}
          <div
            className={`hidden sm:block w-full sm:w-[60%] md:w-[40%] min-w-[260px]`}
          >
            <div className="flex justify-evenly items-center gap-4 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl py-2 px-3 shadow-sm text-sm sm:text-base">
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
                  <FontAwesomeIcon icon={item.icon} className="h-4 mb-1" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="hidden sm:flex items-center gap-4">
            <SearchButton
              isActive={searchVisible}
              onClick={handleSearchToggle}
              className="text-lg text-light-body-text dark:text-dark-body-text hover:text-light-accent dark:hover:text-dark-accent"
            />
            <Toggle />
          </div>
        </div>
      </nav>

      {/* SEARCH INPUT - Overlay positioned absolutely below navbar */}
      {hasMounted && searchVisible && (
        <div className="fixed left-0 right-0 top-16 sm:top-[76px] z-40 bg-light-nav dark:bg-dark-nav shadow-md px-4 py-3 border-t border-light-border dark:border-dark-border">
          <SearchInput
            clearInput={() => setSearchQuery("")}
            searchQuery={searchQuery}
            onSearchSubmit={handleSearchSubmit}
            onInputChange={handleInputChange}
            className="w-full"
          />
        </div>
      )}
    </>
  );
}
