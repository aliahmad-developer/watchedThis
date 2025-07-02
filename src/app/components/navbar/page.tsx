"use client";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShuffle,
  faSpinner,
  faHouse,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import Toggle from "../utilities/toggle";
import Link from "next/link";
import SearchButton from "../utilities/searchButton";
import SearchInput from "../utilities/searchInput";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchClicked, setSearchClicked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { icon: faHouse, label: "Home", href: "/" },
    { icon: faShuffle, label: "Random", href: "/random" },
    { icon: faSpinner, label: "Spinner", href: "/spinner" },
    { icon: faMagnifyingGlass, label: "Find", href: "/find" },
  ];

  const handleSearchClick = () => setSearchClicked((prev) => !prev);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);

const handleRandomClick = (
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string
) => {
  e.preventDefault();
  window.location.href = href; // This will do a full page reload
};

  return (
    <>
      <nav className="w-full bg-light-nav dark:bg-dark-nav shadow-md z-50 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-4 sm:gap-y-0">
          {/* Left: Logo */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <Link
              href="/"
              className="text-3xl font-bold text-dark-accent whitespace-nowrap p-1"
            >
              RandoMovie
            </Link>
            {/* Toggle & Search button (mobile only) */}
            <div className="flex items-center space-x-3 sm:hidden">
              <SearchButton
                isActive={searchClicked}
                onClick={handleSearchClick}
                className="text-lg text-light-body-text dark:text-dark-body-text hover:text-light-accent dark:hover:text-dark-accent"
              />
              {mounted && <Toggle />}
            </div>
          </div>

          {/* Middle: Navigation Links (spaced out, ~1/3 width) */}
          <div className="w-full sm:w-1/3 sm:mx-auto">
            <div className="flex justify-evenly sm:justify-center items-center gap-x-6 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-sm px-4 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) =>
                    item.label === "Random"
                      ? handleRandomClick(e, item.href)
                      : undefined
                  }
                  className={`flex flex-col items-center text-base sm:text-lg font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? "text-light-accent dark:text-dark-accent"
                      : "text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="h-6 sm:h-7 mb-1"
                  />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Toggle + Search on desktop */}
          <div className="hidden sm:flex items-center space-x-4">
            <SearchButton
              isActive={searchClicked}
              onClick={handleSearchClick}
              className="text-lg text-light-body-text dark:text-dark-body-text hover:text-light-accent dark:hover:text-dark-accent"
            />
            {mounted && <Toggle />}
          </div>
        </div>
      </nav>

      {/* Search Input */}
      {searchClicked && (
        <SearchInput
          searchQuery={searchQuery}
          onSearchSubmit={handleSearchSubmit}
          onInputChange={handleInputChange}
          className="bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text border-light-border dark:border-dark-border"
        />
      )}
    </>
  );
}
