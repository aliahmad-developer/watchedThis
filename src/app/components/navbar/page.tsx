"use client";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import {
  faShuffle,
  faSpinner,
  faHouse,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
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

  const handleSearchClick = () => {
    setSearchClicked(!searchClicked);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRandomClick = (e: React.MouseEvent, href: string) => {
    if (pathname === href) {
      e.preventDefault();
      // Force a reload of the random page to get new data
      router.push(href);
      router.refresh();
    }
    // Otherwise, default Link behavior will handle the navigation
  };

  return (
    <>
      <nav
        className="w-full bg-light-nav dark:bg-dark-nav py-3 px-4 shadow-sm z-50"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between">
          {/* First section - empty for now */}
          <div className="flex-1"></div>

          {/* Middle section - navigation icons with even spacing */}
          <div className="flex-1 px-4">
            <div className="w-full bg-light-card dark:bg-dark-card shadow-md rounded-xl border border-light-border dark:border-dark-border min-h-16 flex items-center justify-evenly">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => item.label === "Random" ? handleRandomClick(e, item.href) : undefined}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`flex flex-col items-center p-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 ring-light-accent dark:ring-dark-accent rounded-lg ${
                    pathname === item.href
                      ? "text-light-accent dark:text-dark-accent"
                      : "text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={`mt-1 h-4 ${pathname === item.href ? "text-light-accent dark:text-dark-accent" : ""}`}
                  />
                  <span className="text-xs sm:text-sm mt-1">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Last section - search and toggle */}
          <div className="flex-1 flex items-center justify-end space-x-4">
            <SearchButton
              isActive={searchClicked}
              onClick={handleSearchClick}
              className="text-light-body-text dark:text-dark-body-text hover:text-light-accent dark:hover:text-dark-accent"
            />
            <div className="min-w-10 flex justify-center">
              {mounted && <Toggle />}
            </div>
          </div>
        </div>
      </nav>

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