"use client";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { getFirebaseAuth } from "../../../firebase/firebaseConfig";
import { useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";

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
  const { user, authLoading } = useAuth();
  const initializedRef = useRef(false);

  // Reset so One Tap can re-show after logout
  useEffect(() => {
    if (!authLoading && user === null) {
      initializedRef.current = false;
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Wait until auth state is resolved
    if (authLoading) return;
    // Don't show if already logged in
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
        use_fedcm_for_prompt: false,
      });

      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log(
            "[OneTap] not displayed:",
            notification.getNotDisplayedReason(),
          );
        }
        if (notification.isSkippedMoment()) {
          console.log("[OneTap] skipped:", notification.getSkippedReason());
        }
        if (notification.isDismissedMoment()) {
          sessionStorage.setItem("google-one-tap-dismissed", "true");
        }
      });
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  async function handleCredentialResponse(response: CredentialResponse) {
    try {
      const auth = await getFirebaseAuth();
      const credential = GoogleAuthProvider.credential(response.credential);
      const userCred = await signInWithCredential(auth, credential);
      const idToken = await userCred.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        console.error("[OneTap] session creation failed:", res.status);
        window.dispatchEvent(new Event("auth-updated"));
        return;
      }

      await new Promise((r) => setTimeout(r, 150));
      window.dispatchEvent(new Event("auth-updated"));
    } catch (err) {
      console.error("[OneTap] login failed:", err);
      window.dispatchEvent(new Event("auth-updated"));
    }
  }

  return null;
}
