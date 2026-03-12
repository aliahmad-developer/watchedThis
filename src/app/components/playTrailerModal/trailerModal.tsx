"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Portal from "../utilities/Portal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faSpinner, faRotateRight } from "@fortawesome/free-solid-svg-icons";

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
  // visible drives the enter animation, closing drives the exit
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

    // Tiny delay so the browser has painted before we transition in
    const t = setTimeout(() => setVisible(true), 16);

    // Lock scroll
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

  // Intercept close: play exit animation first, then call onClose
  const handleClose = useCallback(() => {
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, 180); // matches transition duration
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

  // Shared transition: opacity + a whisper of vertical movement
  const transition = "opacity 0.18s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)";
  const isIn = visible && !closing;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-9999 flex items-center justify-center"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: isIn ? 1 : 0,
          transition,
        }}
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col"
          style={{
            width: "min(900px, 95vw)",
            // Barely-there lift on enter, whisper of drop on exit
            transform: isIn ? "translateY(0px)" : "translateY(6px)",
            opacity: isIn ? 1 : 0,
            transition,
          }}
        >
          {/* Floating close */}
          <button
            onClick={handleClose}
            aria-label="Close trailer"
            className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.75)",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.22)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)";
            }}
          >
            <FontAwesomeIcon icon={faClose} className="w-3.5 h-3.5" />
          </button>

          {/* Title row */}
          {title && (
            <div className="flex items-center gap-2.5 mb-3 px-0.5">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#e50914">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
              </svg>
              <span
                className="text-sm font-medium truncate"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {title}
                {year && (
                  <span style={{ color: "rgba(255,255,255,0.3)" }}> · {year}</span>
                )}
              </span>
            </div>
          )}

          {/* Video */}
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "16/9",
              borderRadius: "10px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)",
              background: "#000",
            }}
          >
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="w-6 h-6"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                />
                <span
                  className="text-[10px] tracking-widest uppercase"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  Loading
                </span>
              </div>
            )}

            {!loading && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                  No trailer available
                </p>
                <button
                  onClick={fetchTrailer}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.55)",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
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

          <p
            className="text-center mt-3 text-[10px] tracking-widest uppercase select-none"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            esc to close
          </p>
        </div>
      </div>
    </Portal>
  );
}