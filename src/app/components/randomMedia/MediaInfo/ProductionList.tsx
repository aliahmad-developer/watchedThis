"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { AmbientTextColors } from "../detailsPage";

interface Company {
  id: number;
  name: string | null;
}

interface ProductionListProps {
  companies?: Company[];
  ambientText: AmbientTextColors;
}

// Parse hex → { r, g, b } numbers
function parseRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.trim();
  const full =
    h.length === 4
      ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
      : h.length >= 7
      ? h.slice(0, 7)
      : "#4a90d9";
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  if (isNaN(r)) return { r: 74, g: 144, b: 217 };
  return { r, g, b };
}

// Converts any CSS color string to rgba with given opacity (0–1)
// Works with hex (#rrggbb / #rgb), falls back to a dark neutral
function toRgba(hex: string, alpha: number): string {
  const h = hex.trim();
  const full =
    h.length === 4
      ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
      : h.length >= 7
      ? h.slice(0, 7)
      : "#1a1a2e";
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  if (isNaN(r)) return `rgba(20,20,40,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function ProductionLink({
  company,
  ambientText,
}: {
  company: Company;
  ambientText: AmbientTextColors;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/production/${company.id}`}
      title={company.name ?? "Unknown"}
      className="transition-all duration-200 truncate text-sm block"
      style={{
        color: hovered ? ambientText.primary : ambientText.secondary,
        textDecoration: hovered ? "underline" : "none",
        textUnderlineOffset: "3px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {company.name}
    </Link>
  );
}

function MoreTooltip({
  companies,
  ambientText,
  count,
}: {
  companies: Company[];
  ambientText: AmbientTextColors;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMobile(window.matchMedia("(hover: none)").matches);
  }, []);

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!open || !isMobile) return;
    const close = (e: TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("touchstart", close);
    return () => document.removeEventListener("touchstart", close);
  }, [open, isMobile]);

  // Desktop: delayed close so cursor can travel from pill → tooltip without it snapping shut
  const startClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };


  const { r, g, b } = parseRgb(ambientText.primary);
  const bgR = Math.min(30 + Math.round(r * 0.18), 60);
  const bgG = Math.min(20 + Math.round(g * 0.18), 55);
  const bgB = Math.min(25 + Math.round(b * 0.18), 60);
  const tooltipBg    = `rgba(${bgR}, ${bgG}, ${bgB}, 0.97)`;
  const headerBg     = toRgba(ambientText.primary, 0.14);
  const tooltipBorder = toRgba(ambientText.primary, 0.5);
  const pillBg       = toRgba(ambientText.primary, 0.15);
  const pillBorder   = toRgba(ambientText.primary, 0.4);

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => { if (!isMobile) { cancelClose(); setOpen(true); } }}
        onMouseLeave={() => { if (!isMobile) startClose(); }}
        className="text-xs cursor-pointer select-none px-2.5 py-0.5 rounded-full border transition-all duration-200 font-medium"
        style={{
          color: ambientText.primary,
          borderColor: pillBorder,
          backgroundColor: pillBg,
        }}
      >
        +{count} more
      </button>

      {open && (
        <div
          onMouseEnter={() => { if (!isMobile) cancelClose(); }}
          onMouseLeave={() => { if (!isMobile) startClose(); }}
          className="absolute bottom-full left-0 mb-1 z-50 rounded-2xl shadow-2xl border overflow-hidden"
          style={{
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            minWidth: "190px",
            maxWidth: "250px",
          }}
        >
          {/* Invisible bridge: fills the gap between pill and tooltip so mouse doesn't leave */}
          <div className="absolute -bottom-3 left-0 right-0 h-3" />

          {/* Caret */}
          <div
            className="absolute -bottom-[5px] left-5 w-2.5 h-2.5 rotate-45 border-r border-b"
            style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
          />

          {/* Header */}
          <div
            className="px-3 py-2 border-b flex items-center gap-2"
            style={{
              backgroundColor: headerBg,
              borderColor: toRgba(ambientText.primary, 0.25),
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: ambientText.primary }}
            />
            <span
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: ambientText.primary }}
            >
              Also produced by
            </span>
          </div>

          {/* Company links */}
          <ul className="px-3 py-2.5 flex flex-col gap-2">
            {companies.map((c) => (
              <li key={c.id} className="min-w-0">
                <ProductionLink company={c} ambientText={ambientText} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ProductionList({ companies, ambientText }: ProductionListProps) {
  const filtered = companies?.filter((c) => c.name?.trim()) ?? [];

  if (filtered.length === 0) {
    return (
      <p className="text-sm" style={{ color: ambientText.secondary }}>
        N/A
      </p>
    );
  }

  const visible = filtered.slice(0, 6);
  const hidden = filtered.slice(6);

  return (
    <div>
      <ul className="grid grid-cols-2 gap-y-1.5 gap-x-4">
        {visible.map((c) => (
          <li key={c.id} className="min-w-0">
            <ProductionLink company={c} ambientText={ambientText} />
          </li>
        ))}
      </ul>

      {hidden.length > 0 && (
        <div className="mt-2">
          <MoreTooltip
            companies={hidden}
            ambientText={ambientText}
            count={hidden.length}
          />
        </div>
      )}
    </div>
  );
}