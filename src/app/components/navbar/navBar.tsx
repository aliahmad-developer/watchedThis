"use client";

import { usePathname, useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { createSlug } from "../utilities/createSlug";
import { trackSearch } from "../Recommendation/behaviourTracker";
import AuthButton from "../auth/navButton/authButton";
import {
  useState,
  useEffect,
  useTransition,
  FormEvent,
  ChangeEvent,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShuffle,
  faSpinner,
  faMagnifyingGlass,
  faBars,
  faXmark,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import Toggle from "../utilities/toggle";
import SearchInput from "../utilities/search/searchInput";
import SearchButton from "../utilities/search/searchButton";
import SearchResultsDropdown from "../utilities/search/searchResultsDropdown";
import { MediaResult } from "../utilities/search/searchInput";

// ── Static constants ──────────────────────────────────────────────────────────

const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.6 },
    { name: "name", weight: 0.6 },
    { name: "original_name", weight: 0.3 },
  ],
  threshold: 0.5,
  distance: 200,
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true,
};

const NAV_ITEMS = [
  { label: "Random", icon: faShuffle, href: "/random" },
  { label: "Spinner", icon: faSpinner, href: "/spinner" },
  { label: "Find", icon: faMagnifyingGlass, href: "/find" },
  { label: "Echo", icon: faLayerGroup, href: "/echo" },
] as const;

// ── Search helpers ────────────────────────────────────────────────────────────

async function fetchTMDB(query: string): Promise<MediaResult[]> {
  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

function generateVariants(query: string): string[] {
  const q = query.trim();
  const set = new Set<string>([q]);
  const words = q.split(/\s+/);

  words.filter((w) => w.length >= 3).forEach((w) => set.add(w));

  if (words.length === 1) {
    for (let i = 0; i < q.length - 1; i++) {
      const chars = q.split("");
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      set.add(chars.join(""));
    }
  }

  return [...set].filter((v) => v.length >= 2);
}

async function fetchAllVariants(query: string): Promise<MediaResult[]> {
  const variants = generateVariants(query);
  const allResults = await Promise.all(variants.map(fetchTMDB));

  const seen = new Set<number>();
  const merged: MediaResult[] = [];
  for (const results of allResults) {
    for (const item of results) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
  }
  return merged;
}

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    first?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef]);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  useFocusTrap(drawerRef, drawerOpen);

  // ── Reset on route change ──
  useEffect(() => {
    setSearchVisible(false);
    setSearchQuery("");
    setSearchResults([]);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setSearchVisible(false);
        setSearchQuery("");
        setSearchResults([]);
        setDrawerOpen(false);
        setIsFocused(false);
        setNavVisible(true);
        setHasMounted(true);
        lastScrollY.current = window.scrollY;
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    setHasMounted(true);
    router.prefetch("/search");
    router.prefetch("/random");
    router.prefetch("/spinner");
    router.prefetch("/find");
    router.prefetch("/echo");
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) < 10) return;
      setNavVisible(currentY < 10 || delta < 0);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Escape") {
        if (searchVisible) {
          setSearchVisible(false);
          setSearchQuery("");
          setSearchResults([]);
        }
        if (drawerOpen) setDrawerOpen(false);
        return;
      }

      if (e.key === "/" && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSearchVisible(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchVisible, drawerOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearchLoading(true);
      try {
        const merged = await fetchAllVariants(searchQuery);
        const fuse = new Fuse(merged, FUSE_OPTIONS);
        const fuseResults = fuse.search(searchQuery);
        const reranked =
          fuseResults.length > 0 ? fuseResults.map((r) => r.item) : merged;

        startTransition(() => {
          setSearchResults(reranked.slice(0, 5));
          setIsSearchLoading(false);
        });
      } catch (err) {
        console.error("Search error:", err);
        startTransition(() => {
          setSearchResults([]);
          setIsSearchLoading(false);
        });
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Close dropdown on outside click ──
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

  // ── Body scroll lock when drawer open ──
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // ── Sync --navbar-h CSS variable ──
  useEffect(() => {
    const el = document.getElementById("main-navbar");
    if (!el) return;

    let frameId: number;

    const update = () => {
      frameId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          "--navbar-h",
          `${el.offsetHeight}px`,
        );
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearchToggle = useCallback(() => {
    setSearchVisible((prev) => {
      if (!prev) {
        setSearchQuery("");
        setSearchResults([]);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return !prev;
    });
  }, []);

  const handleSearchSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      trackSearch(searchQuery);
      const query = searchQuery.trim();
      if (query) {
        setSearchQuery("");
        setSearchVisible(false);
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
    },
    [searchQuery, router],
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearInput = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    inputRef.current?.focus();
  }, []);

  const handleRandomClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      try {
        const res = await fetch("/api/randomCall", { cache: "no-store" });
        const data = await res.json();
        const slug = createSlug(data.title || data.name || "");
        const newUrl = `/random/${data.media_type}/${slug}/${data.id}`;
        if (window.location.pathname === newUrl) {
          window.location.reload();
        } else {
          window.location.href = newUrl;
        }
      } catch (err) {
        console.error("Random nav failed:", err);
      }
    },
    [],
  );

  const handleCloseDropdown = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleDropdownMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div id="main-navbar" className="sticky top-0 z-50">
        <div
          className={`transition-transform duration-300 ${
            navVisible ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <nav className="w-full bg-light-nav dark:bg-dark-nav border-b border-light-border dark:border-dark-border shadow-sm">
            {/* ── Mobile / Tablet row (hidden on lg+) ── */}
            <div className="flex lg:hidden items-center h-14 px-3 sm:px-4 gap-2">
              <button
                className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md
                           text-light-secondary-text dark:text-dark-secondary-text
                           hover:text-light-accent dark:hover:text-dark-accent
                           hover:bg-light-card dark:hover:bg-dark-card transition-colors bg-transparent"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                aria-controls="mobile-drawer"
              >
                <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
              </button>

              <Link href="/" className="shrink-0 flex items-center">
                <Image
                  src="/watchedthis.svg"
                  alt="WatchedThis"
                  width={140}
                  height={32}
                  priority
                />
              </Link>

              <div className="flex-1" aria-hidden="true" />

              <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                <SearchButton
                  isActive={searchVisible}
                  onClick={handleSearchToggle}
                  size="sm"
                />
                <Toggle size="sm" />
                <AuthButton />
              </div>
            </div>

            {/* ── Desktop 3-column grid (hidden below lg) ── */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-14 px-6">
              {/* Col 1 — Logo */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/watchedthis.svg"
                    alt="WatchedThis"
                    width={200}
                    height={30}
                    priority
                  />
                </Link>
              </div>

              {/* Col 2 — Nav pills */}
              <div className="flex items-center gap-8 xl:gap-12 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg py-1.5 px-8 xl:px-12 shadow-sm">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={
                      item.label === "Random" ? handleRandomClick : undefined
                    }
                    className={`flex flex-col items-center justify-center text-sm font-medium transition-colors duration-200 ${
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

              {/* Col 3 — Controls */}
              <div className="flex items-center justify-end gap-2">
                <div className="relative group">
                  <SearchButton
                    isActive={searchVisible}
                    onClick={handleSearchToggle}
                    size="sm"
                  />
                  {!searchVisible && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute right-0 top-full mt-2 flex items-center gap-1 whitespace-nowrap rounded-md border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card px-2 py-1 text-[11px] text-light-secondary-text dark:text-dark-secondary-text shadow-md opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150"
                    >
                      Press
                      <kbd className="mx-0.5 px-1 py-0.5 rounded border border-light-border dark:border-dark-border font-mono text-[10px]">
                        /
                      </kbd>
                      to search
                    </div>
                  )}
                </div>
                <Toggle size="sm" />
                <AuthButton />
              </div>
            </div>
          </nav>

          {/* ── Search overlay ── */}
          {hasMounted && searchVisible && (
            <div className="absolute left-0 right-0 top-full z-40">
              <div className="bg-light-nav dark:bg-dark-nav border-b border-light-border dark:border-dark-border shadow-md px-3 sm:px-4 lg:px-6 py-2">
                <SearchInput
                  clearInput={handleClearInput}
                  searchQuery={searchQuery}
                  onSearchSubmit={handleSearchSubmit}
                  onInputChange={handleInputChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full text-sm"
                  inputRef={(el) => {
                    inputRef.current = el;
                  }}
                  autoFocus
                />
              </div>

              {isFocused && searchQuery.length >= 2 && (
                <div
                  ref={dropdownRef}
                  className="px-3 sm:px-4 lg:px-6"
                  onMouseDown={handleDropdownMouseDown}
                >
                  <SearchResultsDropdown
                    results={searchResults}
                    searchQuery={searchQuery}
                    isLoading={isSearchLoading}
                    onClose={handleCloseDropdown}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile / Tablet Drawer ── */}
      {hasMounted && (
        <>
          {/* Backdrop — fades in/out */}
          <div
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
            className="lg:hidden fixed inset-0 z-40 bg-black"
            style={{
              opacity: drawerOpen ? 0.45 : 0,
              pointerEvents: drawerOpen ? "auto" : "none",
              transition: "opacity 300ms ease",
            }}
          />

          {/* Drawer panel — slides in from left + fades in */}
          <div
            id="mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="lg:hidden fixed top-0 left-0 z-50 h-full w-60 sm:w-64 bg-light-nav dark:bg-dark-nav shadow-2xl flex flex-col"
            style={{
              transform: drawerOpen ? "translateX(0)" : "translateX(-12px)",
              opacity: drawerOpen ? 1 : 0,
              pointerEvents: drawerOpen ? "auto" : "none",
              transition: drawerOpen
                ? "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 250ms ease"
                : "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3.5 border-b border-light-border dark:border-dark-border">
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setDrawerOpen(false)}
              >
                <Image
                  src="/watchedthis.svg"
                  alt="WatchedThis"
                  width={130}
                  height={32}
                  priority
                />
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent
                           text-light-secondary-text dark:text-dark-secondary-text
                           hover:text-light-accent dark:hover:text-dark-accent
                           hover:bg-light-card dark:hover:bg-dark-card transition-colors"
                aria-label="Close menu"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    if (item.label === "Random") handleRandomClick(e);
                    setDrawerOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 border-b border-teal-500/30 last:border-b-0 ${
                    pathname === item.href
                      ? "bg-light-card dark:bg-dark-card text-light-accent dark:text-dark-accent"
                      : "text-light-secondary-text dark:text-dark-secondary-text hover:bg-light-card dark:hover:bg-dark-card hover:text-light-accent dark:hover:text-dark-accent"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="h-4 w-4 shrink-0"
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
