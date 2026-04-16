"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreenButton } from "@fortawesome/free-solid-svg-icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsAvailable(true);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      deferredPromptRef.current = null;
      setIsAvailable(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;

    setIsInstalling(true);

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }

      deferredPromptRef.current = null;
      setIsAvailable(false);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled || !isAvailable) return null;

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      aria-label="Install WatchedThis app"
      className="
        group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
        border border-light-border dark:border-dark-border
        hover:shadow-sm transition-all duration-200
        active:scale-[0.98]
        disabled:opacity-60
      "
    >
      {isInstalling ? (
        <>
          <svg
            className="animate-spin shrink-0"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Installing…
        </>
      ) : (
        <>
          <FontAwesomeIcon
            icon={faMobileScreenButton}
            className="text-sm group-hover:-translate-y-px transition-transform duration-200"
          />
          Install App
        </>
      )}
    </button>
  );
}