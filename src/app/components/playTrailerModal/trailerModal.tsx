"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Portal from "../utilities/Portal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface TrailerModalProps {
  mediaId: number;
  mediaType: "movie" | "tv";
  onClose: () => void;
  title?: string;
}

export default function TrailerModal({
  mediaId,
  mediaType,
  onClose,
  title,
}: TrailerModalProps) {
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const MAX_RETRIES = 2;

  const fetchTrailer = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${mediaId}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      );
      if (!response.ok) throw new Error("TMDB API failed");

      const data = await response.json();
      const videos = data.results || [];

      const youtubeVideos = videos.filter((v: any) => v.site === "YouTube");
      const trailer =
        youtubeVideos.find((v: any) => v.type === "Trailer" && v.official) ||
        youtubeVideos.find((v: any) => v.type === "Trailer") ||
        youtubeVideos.find((v: any) =>
          v.name.toLowerCase().includes("trailer")
        ) ||
        youtubeVideos[0];

      if (trailer?.key) {
        setVideoKey(trailer.key);
      } else {
        throw new Error("No trailer found");
      }
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        return;
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [mediaId, mediaType, retryCount]);

  useEffect(() => {
    if (retryCount > 0 && retryCount <= MAX_RETRIES) {
      const timer = setTimeout(fetchTrailer, 1000 * retryCount);
      return () => clearTimeout(timer);
    }
  }, [retryCount, fetchTrailer]);

  useEffect(() => {
    fetchTrailer();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "m" || e.key === "M") setIsMuted((prev) => !prev);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [fetchTrailer, onClose]);

  const getEmbedUrl = useCallback(() => {
    if (!videoKey) return "";
    return `https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=${
      isMuted ? 1 : 0
    }&rel=0&playsinline=1&enablejsapi=1`;
  }, [videoKey, isMuted]);

  const toggleFullscreen = () => {
    if (!modalRef.current) return;

    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-auto">
        <div
          ref={modalRef}
          className={`bg-black shadow-2xl overflow-hidden ${
            isFullscreen ? "w-full h-full" : "max-w-4xl w-full mx-2 my-auto"
          }`}
          style={{
            // Ensure the modal doesn't exceed viewport height on small devices
            maxHeight: isFullscreen ? "100%" : "calc(100vh - 2rem)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold truncate max-w-[70%]">
              {"Play Trailer"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-md text-white hover:bg-red-700 transition bg-transparent"
                aria-label="Close trailer"
              >
                <FontAwesomeIcon
                  icon={faClose}
                  className="w-3 h-3 sm:w-4 sm:h-4"
                />
              </button>
            </div>
          </div>

          {/* Video */}
          <div className="w-full aspect-video bg-black relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  size="2x"
                  className="text-white"
                />
                <span className="text-white text-sm">Loading trailer...</span>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-4 py-8 text-white">
                <p className="text-ligt-accent dark:text-dark-accent text-lg mb-3">
                  Trailer not available
                </p>
                <button
                  onClick={() => {
                    setRetryCount(0);
                    fetchTrailer();
                  }}
                  className="px-4 py-2 bg-light-accent text-white dark:bg-dark-accent rounded hover:light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg transition"
                >
                  Try Again
                </button>
              </div>
            ) : videoKey ? (
              <iframe
                ref={iframeRef}
                className="absolute inset-0 w-full h-full"
                src={getEmbedUrl()}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={title || "Trailer"}
                loading="eager"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-4 py-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md w-full border border-white/20">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-white">
                      Trailer Unavailable
                    </h3>
                    <p className="text-gray-300">
                      We couldn't find a trailer for this content.
                    </p>
                    <button className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full text-white font-medium transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
