"use client";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { getFirebaseAuth } from "../../../firebase/firebaseConfig";
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
  // Guard against double-fires from FedCM / GSI calling the callback twice
  const signingInRef = useRef(false);

  // Reset so One Tap can re-show after logout
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
    // Prevent double-fire from FedCM/GSI
    if (signingInRef.current) return;
    signingInRef.current = true;

    try {
      const auth = await getFirebaseAuth();
      const credential = GoogleAuthProvider.credential(response.credential);

      // 1. Sign in to Firebase client SDK to get a fully hydrated User object
      const result = await signInWithCredential(auth, credential);

      // 2. Exchange for a fresh id token and create the server-side session cookie.
      //    This MUST complete before we notify the rest of the app, otherwise
      //    any server fetch that fires on auth state change will get a 401 and
      //    wipe the user's library / recommendations.
      const idToken = await result.user.getIdToken(true);

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create server session");
      }

      // 3. Confirm the cookie is readable end-to-end before triggering UI updates.
      //    This serialises the race: cookie set → CDN propagates → me resolves → UI.
      await fetch("/api/auth/me", { credentials: "include" });

      // 4. Now it's safe to notify the rest of the app.
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
