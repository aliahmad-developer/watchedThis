"use client";

import { useState } from "react";
import { SpinnerItem } from "./types";
import SpinWheel from "./spinWheel";
import EditModal from "./spinnerEditModal";
import ResultModal from "./resultsModal";
import { useInitialMedia } from "./initialMedia";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders, faRotate } from "@fortawesome/free-solid-svg-icons";

const MAX_SLOTS = 20;

export default function Spinner() {
  const { slots, setSlots, loading, reshuffling, reshuffle } =
    useInitialMedia();
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
      const count = slots.filter(Boolean).length;
      const deg = 360 / count;
      const normalized = ((newRotation % 360) + 360) % 360;
      const pointer = (360 - normalized) % 360;
      const index = Math.floor(pointer / deg) % count;
      if (slots[index]) setResult(slots[index]!);
    }, 4000);
  };

  return (
    <div
      className="relative bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-start  md:justify-center gap-4 px-4 overflow-hidden pt-6 md:pt-0"
      style={{ minHeight: "calc(100dvh - var(--navbar-h, 64px))" }}
    >
      <div
        style={{
          width: "min(90vw, calc(100svh - var(--navbar-h, 64px) - 120px))",
          height: "min(90vw, calc(100svh - var(--navbar-h, 64px) - 120px))",
          maxWidth: "480px",
          maxHeight: "480px",
          flexShrink: 0,
        }}
      >
        <SpinWheel
          slots={slots}
          rotation={rotation}
          isSpinning={isSpinning}
          loading={loading}
          onRemoveSlot={handleRemoveSlot}
        />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Reshuffle */}
        <button
          onClick={() => reshuffle(blacklist)}
          disabled={isSpinning || loading || reshuffling}
          title="Fetch new random media"
          className="w-12 h-12 rounded-xl flex items-center justify-center
      bg-light-card dark:bg-dark-card
      border border-light-border dark:border-dark-border
      hover:bg-light-border dark:hover:bg-dark-border
      transition disabled:opacity-40"
        >
          <FontAwesomeIcon
            icon={faRotate}
            className={`h-4 w-4 text-light-secondary-text dark:text-dark-secondary-text ${reshuffling ? "animate-spin" : ""}`}
          />
        </button>

        {/* Spin */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || loading || slots.filter(Boolean).length === 0}
          className="px-14 h-12 rounded-xl
      bg-light-accent dark:bg-dark-accent
      text-white font-bold text-base tracking-wide
      hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover
      transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSpinning ? "Spinning…" : "Spin"}
        </button>

        {/* Filter */}
        <button
          onClick={() => setModalOpen(true)}
          disabled={isSpinning}
          title="Filter wheel"
          className="w-12 h-12 rounded-xl flex items-center justify-center
      bg-light-card dark:bg-dark-card
      border border-light-border dark:border-dark-border
      hover:bg-light-border dark:hover:bg-dark-border
      transition disabled:opacity-40"
        >
          <FontAwesomeIcon
            icon={faSliders}
            className="h-4 w-4 text-light-secondary-text dark:text-dark-secondary-text"
          />
        </button>
      </div>
      <EditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onFill={handleFill}
        blacklist={blacklist}
        onUpdateBlacklist={setBlacklist}
      />
      {result && <ResultModal item={result} onClose={() => setResult(null)} />}
    </div>
  );
}
