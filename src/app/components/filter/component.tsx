import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan } from "@fortawesome/free-solid-svg-icons";

// ── DualRangeSlider ────────────────────────────────────────────────────────

export function DualRangeSlider({ min, max, step = 1, value, onChange, formatLabel }: {
  min: number; max: number; step?: number; value: [number, number];
  onChange: (v: [number, number]) => void; formatLabel?: (v: number) => string;
}) {
  const [low, high] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const fmt = formatLabel ?? String;
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs font-semibold text-light-text dark:text-dark-text">
        <span>{fmt(low)}</span><span>{fmt(high)}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-light-border dark:bg-dark-border" />
        <div className="absolute h-1.5 rounded-full bg-light-accent dark:bg-dark-accent"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }} />
        <input type="range" min={min} max={max} step={step} value={low}
          onChange={e => onChange([Math.min(Number(e.target.value), high - step), high])}
          className="dual-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: low > max - (max - min) * 0.1 ? 5 : 3 }} />
        <input type="range" min={min} max={max} step={step} value={high}
          onChange={e => onChange([low, Math.max(Number(e.target.value), low + step)])}
          className="dual-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: 4 }} />
      </div>
    </div>
  );
}

// ── SectionLabel ───────────────────────────────────────────────────────────

export function SectionLabel({ icon, label, children }: { icon?: any; label?: string; children?: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-light-secondary-text dark:text-dark-secondary-text mb-2">
      {icon && <FontAwesomeIcon icon={icon} className="h-3 text-light-accent dark:text-dark-accent" />}
      {label ?? children}
    </p>
  );
}

// ── GenreChip ──────────────────────────────────────────────────────────────

export type GenreState = "neutral" | "include" | "exclude";

export function GenreChip({ name, state, onClick }: {
  name: string; state: GenreState; onClick: () => void;
}) {
  const styles: Record<GenreState, string> = {
    neutral: "bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent",
    include: "bg-light-accent dark:bg-dark-accent text-white border-transparent scale-105",
    exclude: "bg-red-500/15 border-red-500/40 text-red-400",
  };
  return (
    <button
      onClick={onClick}
      title={state === "neutral" ? "Click to include" : state === "include" ? "Click to exclude" : "Click to clear"}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${styles[state]}`}
    >
      {state === "exclude" && <FontAwesomeIcon icon={faBan} className="h-2.5 mr-1 opacity-75" />}
      {name}
    </button>
  );
}

// ── SliderStyles ───────────────────────────────────────────────────────────
// Drop <SliderStyles /> anywhere once in the tree (e.g. in a layout) or
// inside each page/modal that uses DualRangeSlider.

export function SliderStyles() {
  return (
    <style>{`
      .dual-thumb::-webkit-slider-thumb {
        -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
        background: #9ca3af; border: 2.5px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25); pointer-events: all; cursor: pointer; transition: transform 0.15s;
      }
      .dual-thumb::-webkit-slider-thumb:hover { transform: scale(1.05); }
      .dark .dual-thumb::-webkit-slider-thumb { background: #ffffff; }
      .dual-thumb::-moz-range-thumb {
        width: 20px; height: 20px; border-radius: 50%;
        background: #9ca3af; border: 2.5px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25); pointer-events: all; cursor: pointer; transition: transform 0.15s;
      }
      .dual-thumb::-moz-range-thumb:hover { transform: scale(1.05); }
      .dark .dual-thumb::-moz-range-thumb { background: #ffffff; }
    `}</style>
  );
}