"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Portal from "../utilities/Portal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faSpinner,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

interface TrailerModalProps {
  mediaId: number;
  mediaType: "movie" | "tv";
  onClose: () => void;
  title?: string;
  year?: string;
}

export default function TrailerModal({
  mediaId,
  mediaType,
  onClose,
  title,
  year,
}: TrailerModalProps) {
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchTrailer = useCallback(async () => {
    setLoading(true);
    setError(false);
    setVideoKey(null);
    try {
      const params = new URLSearchParams({
        mediaId: String(mediaId),
        mediaType,
        ...(title && { title }),
        ...(year && { year }),
      });
      const res = await fetch(`/api/trailer?${params.toString()}`);
      if (!res.ok) throw new Error("No trailer found");
      const data = await res.json();
      if (data.key) setVideoKey(data.key);
      else throw new Error("No key in response");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [mediaId, mediaType, title, year]);

  useEffect(() => {
    fetchTrailer();
    const t = setTimeout(() => setVisible(true), 16);
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [fetchTrailer]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const embedUrl = videoKey
    ? `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&playsinline=1&enablejsapi=1&modestbranding=1&color=white`
    : "";

  const isIn = visible && !closing;
  const transition =
    "opacity 0.22s ease, transform 0.26s cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          opacity: isIn ? 1 : 0,
          transition: "opacity 0.22s ease",
        }}
        onClick={handleClose}
      >
        {/* Modal container */}
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col w-full overflow-hidden"
          style={{
            maxWidth: "880px",
            borderRadius: "14px",
            background: "rgba(12, 12, 14, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            transform: isIn
              ? "translateY(0) scale(1)"
              : "translateY(12px) scale(0.98)",
            opacity: isIn ? 1 : 0,
            transition,
          }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.07)" }}
          >
            {/* Left: YouTube logo + title */}
            <div className="flex items-center gap-3 min-w-0">
              <svg
                className="w-5 h-5 shrink-0"
                viewBox="0 0 24 24"
                fill="#ff0000"
              >
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
              </svg>

              <div className="flex items-baseline gap-2 min-w-0">
                {title ? (
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {title}
                  </span>
                ) : (
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    Trailer
                  </span>
                )}
                {year && (
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {year}
                  </span>
                )}
              </div>
            </div>

            {/* Right: esc hint + close button */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className="hidden sm:block text-[10px] tracking-widest uppercase select-none"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                esc to close
              </span>
              <button
                onClick={handleClose}
                aria-label="Close trailer"
                className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.55)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "rgba(255,255,255,0.55)";
                }}
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Video ──────────────────────────────────────── */}
          <div
            className="relative w-full"
            style={{ aspectRatio: "16/9", background: "#000" }}
          >
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="w-5 h-5"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                />
                <span
                  className="text-[10px] tracking-widest uppercase"
                  style={{ color: "rgba(255,255,255,0.15)" }}
                >
                  Loading
                </span>
              </div>
            )}

            {!loading && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <p
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  No trailer available
                </p>
                <button
                  onClick={fetchTrailer}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.85)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.5)";
                  }}
                >
                  <FontAwesomeIcon icon={faRotateRight} className="w-3 h-3" />
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && videoKey && (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={title || "Trailer"}
                loading="eager"
              />
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
