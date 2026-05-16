"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreenButton } from "@fortawesome/free-solid-svg-icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

export default function InstallButton() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    ) {
      setIsInstalled(true);
      return;
    }

    const beforeInstallPromptHandler = (event: Event) => {
      event.preventDefault();

      deferredPrompt.current = event as BeforeInstallPromptEvent;

      setIsAvailable(true);
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setIsAvailable(false);
      deferredPrompt.current = null;
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);

    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallPromptHandler,
      );

      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPrompt.current;

    if (!promptEvent) return;

    setIsInstalling(true);

    try {
      await promptEvent.prompt();

      const choiceResult = await promptEvent.userChoice;

      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }

      deferredPrompt.current = null;
      setIsAvailable(false);
    } catch (error) {
      console.error("Install prompt failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled || !isAvailable) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={isInstalling}
      aria-label="Install WatchedThis app"
      className="
        group flex items-center gap-2
        px-3 py-1.5 rounded-md
        text-xs font-medium
        border border-light-border dark:border-dark-border
        hover:shadow-sm
        transition-all duration-200
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
            className="
              text-sm
              group-hover:-translate-y-px
              transition-transform duration-200
            "
          />
          Install App
        </>
      )}
    </button>
  );
}
