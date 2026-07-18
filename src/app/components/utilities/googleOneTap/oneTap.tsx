"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef } from "react";
import { useAuth } from "../../../context/authContext";

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

export default function GoogleOneTap() {
  const { user, status } = useAuth();
  const authLoading = status === "loading";
  const initializedRef = useRef(false);
  const signingInRef = useRef(false);

  useEffect(() => {
    if (!authLoading && user === null) {
      initializedRef.current = false;
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (user !== null) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (sessionStorage.getItem("google-one-tap-dismissed")) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;

    const init = () => {
      if (cancelled) return;

      const google = window.google;

      if (!google?.accounts?.id) {
        attempts++;
        if (attempts < maxAttempts) setTimeout(init, 300);
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        use_fedcm_for_prompt: true,
      });

      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log(
            "[OneTap] not displayed:",
            notification.getNotDisplayedReason(),
          );
        }
        if (notification.isSkippedMoment()) {
          sessionStorage.setItem("google-one-tap-dismissed", "1");
        }
        if (notification.isDismissedMoment()) {
          sessionStorage.setItem("google-one-tap-dismissed", "1");
        }
      });
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  async function handleCredentialResponse(response: CredentialResponse) {
    if (signingInRef.current) return;
    signingInRef.current = true;

    try {
      const supabase = createClient();

      // Supabase signs in directly from the Google ID token and syncs the
      // session cookie via the @supabase/ssr client — no manual session/me
      // round-trip needed.
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });

      if (error) throw error;

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-updated"));
      }
    } catch (err) {
      console.error("[OneTap] login failed:", err);
    } finally {
      signingInRef.current = false;
    }
  }

  return null;
}
