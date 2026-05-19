"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreenButton } from "@fortawesome/free-solid-svg-icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed check
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Avoid repeated prompts in same session
    const dismissed = sessionStorage.getItem("pwa-install-dismissed");

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();

      deferredPrompt.current = event as BeforeInstallPromptEvent;

      if (!dismissed) {
        setIsAvailable(true);
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsAvailable(false);
      deferredPrompt.current = null;
      sessionStorage.removeItem("pwa-install-dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPrompt.current;
    if (!promptEvent) return;

    setIsInstalling(true);

    try {
      await promptEvent.prompt();

      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      } else {
        sessionStorage.setItem("pwa-install-dismissed", "true");
      }

      deferredPrompt.current = null;
      setIsAvailable(false);
    } catch (err) {
      console.error("Install failed:", err);
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
      aria-label="Install app"
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
            className="animate-spin"
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
            className="text-sm transition-transform group-hover:-translate-y-px"
          />
          Install App
        </>
      )}
    </button>
  );
}
