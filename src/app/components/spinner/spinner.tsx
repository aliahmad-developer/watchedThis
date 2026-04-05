"use client";

import { useState, useEffect } from "react";
import { SpinnerItem } from "./types";
import SpinWheel from "./spinWheel";
import EditModal from "./spinnerEditModal";
import ResultModal from "./resultsModal";
import { useInitialMedia } from "./initialMedia";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders, faRotate } from "@fortawesome/free-solid-svg-icons";

const MAX_SLOTS = 20;

interface Filters {
  mediaType: "movie" | "tv";
  genres: number[];
  excludeGenres: number[];
  excludeKeywords: string[];
  keywords: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  sortBy: string;
  strictMode: boolean;
}

export default function Spinner() {
  const { slots, setSlots, loading, reshuffling, reshuffle } =
    useInitialMedia();
  const [filters, setFilters] = useState<Filters>({
    mediaType: "movie",
    genres: [],
    excludeGenres: [],
    excludeKeywords: [],
    keywords: [],
    yearRange: [1950, new Date().getFullYear()],
    ratingRange: [0, 10],
    sortBy: "popularity.desc",
    strictMode: false,
  });
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState<SpinnerItem | null>(null);
  const [blacklist, setBlacklist] = useState<SpinnerItem[]>([]);

  const handleFill = (items: SpinnerItem[]) => {
    setSlots(items.slice(0, MAX_SLOTS));
  };

  const handleRemoveSlot = (item: SpinnerItem) => {
    setSlots((prev) => prev.map((s) => (s?.id === item.id ? null : s)));
    setBlacklist((prev) =>
      prev.find((b) => b.id === item.id) ? prev : [...prev, item],
    );
  };

  const handleSpin = () => {
    if (isSpinning || slots.filter(Boolean).length === 0) return;
    setIsSpinning(true);
    setResult(null);

    const spins = 5 + Math.random() * 3;
    const extra = Math.random() * 360;
    const newRotation = rotation + spins * 360 + extra;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const activeSlots = slots.filter(Boolean) as SpinnerItem[]; // ✅ compact array
      const count = activeSlots.length;
      if (count === 0) return;
      const deg = 360 / count;
      const normalized = ((newRotation % 360) + 360) % 360;
      const pointer = (360 - normalized) % 360;
      const index = Math.floor(pointer / deg) % count;
      setResult(activeSlots[index]); // ✅ index into filtered array
    }, 4000);
  };

  return (
    <>
      <div className="bg-light-bg dark:bg-dark-bg sm:min-h-[calc(100svh-var(--navbar-h,70px))] flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 py-2 sm:py-4">
          {/* Main container - always column layout */}
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
            {/* Wheel container */}
            <div className="shrink-0">
              <div
                style={{
                  width: "min(85vw, 85vh, 450px)",
                  height: "min(85vw, 85vh, 450px)",
                }}
                className="mx-auto"
              >
                <SpinWheel
                  slots={slots}
                  rotation={rotation}
                  isSpinning={isSpinning}
                  loading={loading}
                  onRemoveSlot={handleRemoveSlot}
                />
              </div>
            </div>

            {/* Controls container - always below the wheel */}
            <div className="w-full flex justify-center">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {/* Action buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Reshuffle */}
                  <button
                    onClick={() => reshuffle(filters, blacklist)}
                    disabled={isSpinning || loading || reshuffling}
                    title="Fetch new filtered media"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                      bg-light-card dark:bg-dark-card
                      border border-light-border dark:border-dark-border
                      hover:bg-light-border dark:hover:bg-dark-border
                      transition-all duration-200 hover:scale-105 active:scale-95
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <FontAwesomeIcon
                      icon={faRotate}
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-light-secondary-text dark:text-dark-secondary-text ${
                        reshuffling ? "animate-spin" : ""
                      }`}
                    />
                  </button>

                  {/* Spin */}
                  <button
                    onClick={handleSpin}
                    disabled={
                      isSpinning ||
                      loading ||
                      slots.filter(Boolean).length === 0
                    }
                    className="px-5 sm:px-10 h-10 sm:h-12 min-w-[90px] sm:min-w-[120px] rounded-xl
                      bg-light-accent dark:bg-dark-accent
                      text-white font-bold text-sm sm:text-base tracking-wide
                      hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover
                      transition-all duration-200 hover:scale-105 active:scale-95
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSpinning ? "Spinning…" : "Spin"}
                  </button>

                  {/* Filter */}
                  <button
                    onClick={() => setModalOpen(true)}
                    disabled={isSpinning}
                    title="Filter wheel"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                      bg-light-card dark:bg-dark-card
                      border border-light-border dark:border-dark-border
                      hover:bg-light-border dark:hover:bg-dark-border
                      transition-all duration-200 hover:scale-105 active:scale-95
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <FontAwesomeIcon
                      icon={faSliders}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-light-secondary-text dark:text-dark-secondary-text"
                    />
                  </button>
                </div>

                {/* Optional: Status indicator for empty wheel */}
                {slots.filter(Boolean).length === 0 && !loading && (
                  <div className="text-xs text-light-secondary-text dark:text-dark-secondary-text text-center">
                    No items to spin. Click the filter button to add items.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onFill={handleFill}
        blacklist={blacklist}
        onUpdateBlacklist={setBlacklist}
        filters={filters}
        onSetFilters={setFilters}
      />
      {result && <ResultModal item={result} onClose={() => setResult(null)} />}
    </>
  );
}
