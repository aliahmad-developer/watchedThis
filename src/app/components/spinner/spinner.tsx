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
  const { slots, setSlots, loading, fetchRandom } = useInitialMedia();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState<SpinnerItem | null>(null);
  const [reshuffling, setReshuffling] = useState(false);
  const [blacklist, setBlacklist] = useState<SpinnerItem[]>([]);

  const handleFill = (items: SpinnerItem[]) => {
    setSlots(items.slice(0, MAX_SLOTS));
  };

  // Right-click on wheel segment → remove it + add to blacklist
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

  const handleReshuffle = async () => {
    if (isSpinning || reshuffling) return;
    setReshuffling(true);
    try {
      const items = await fetchRandom();
      const blacklistIds = new Set(blacklist.map((b) => b.id));
      const filtered = (items as SpinnerItem[]).filter(
        (item) => !blacklistIds.has(item.id),
      );
      const padded = filtered.slice(0, MAX_SLOTS);
      while (padded.length < MAX_SLOTS) padded.push(null as any);
      setSlots(padded);
    } finally {
      setReshuffling(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center gap-8 px-6 py-12 overflow-hidden">
      {/* Wheel */}
      <SpinWheel
        slots={slots}
        rotation={rotation}
        isSpinning={isSpinning}
        loading={loading}
        onRemoveSlot={handleRemoveSlot}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReshuffle}
          disabled={isSpinning || loading || reshuffling}
          title="Fetch new random media"
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-light-body-text dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-light-secondary-text dark:hover:bg-dark-border transition disabled:opacity-40"
        >
          <FontAwesomeIcon
            icon={faRotate}
            className={`h-4 w-4 text-light-text dark:text-dark-text ${reshuffling ? "animate-spin" : ""}`}
          />
        </button>

        <button
          onClick={handleSpin}
          disabled={isSpinning || loading || slots.filter(Boolean).length === 0}
          className="px-14 h-12 rounded-xl bg-light-accent dark:bg-dark-accent text-white font-bold text-base tracking-wide transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSpinning ? "Spinning…" : "Spin"}
        </button>

        <button
          onClick={() => setModalOpen(true)}
          disabled={isSpinning}
                   className="w-12 h-12 rounded-xl flex items-center justify-center bg-light-body-text dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-light-secondary-text dark:hover:bg-dark-border transition disabled:opacity-40"

          title="Filter wheel"
        >
          <FontAwesomeIcon
            icon={faSliders}
            className="h-4 w-4 text-light-text dark:text-dark-text"
          />
        </button>
      </div>

      {/* Edit modal */}
      <EditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onFill={handleFill}
        blacklist={blacklist}
        onUpdateBlacklist={setBlacklist}
      />

      {/* Result modal */}
      {result && <ResultModal item={result} onClose={() => setResult(null)} />}
    </div>
  );
}
