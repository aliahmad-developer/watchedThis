"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;

          prompt: (
            momentListener?: (notification: PromptMomentNotification) => void,
          ) => void;

          cancel: () => void;

          disableAutoSelect?: () => void;
        };
      };
    };
  }

  interface CredentialResponse {
    credential: string;
    select_by?: string;
  }

  interface PromptMomentNotification {
    isDisplayMoment: () => boolean;
    isDisplayed: () => boolean;

    isNotDisplayed: () => boolean;
    getNotDisplayedReason: () => string;

    isSkippedMoment: () => boolean;
    getSkippedReason: () => string;

    isDismissedMoment: () => boolean;
    getDismissedReason: () => string;
  }
}

function hasActiveSession(): boolean {
  return document.cookie.includes("__session=");
}

export default function GoogleOneTap() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) return;

    if (hasActiveSession()) return;

    /**
     * Prevent showing repeatedly after dismissal
     * during current browser session.
     */
    if (sessionStorage.getItem("google-one-tap-dismissed")) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const maxAttempts = 30;

    const init = () => {
      if (cancelled) return;

      const google = window.google;

      if (!google?.accounts?.id) {
        attempts++;

        if (attempts < maxAttempts) {
          setTimeout(init, 300);
        }

        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,

        callback: handleCredentialResponse,

        auto_select: true,

        cancel_on_tap_outside: true,

        context: "signin",

        use_fedcm_for_prompt: true,
      });

      google.accounts.id.prompt((notification) => {
        if (notification.isDismissedMoment()) {
          sessionStorage.setItem("google-one-tap-dismissed", "true");
        }
      });
    };

    init();

    return () => {
      cancelled = true;

      window.google?.accounts?.id?.cancel();
    };
  }, []);

  async function handleCredentialResponse(response: CredentialResponse) {
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken: response.credential,
        }),
      });

      window.dispatchEvent(new Event("auth-updated"));
    } catch {
      console.error("Login failed");
    }
  }
  return null;
}
