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
            nonce?: string;
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

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function GoogleOneTap() {
  const { user, status } = useAuth();
  const authLoading = status === "loading";
  const initializedRef = useRef(false);
  const signingInRef = useRef(false);
  const nonceRef = useRef<string | null>(null);

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

    const init = async () => {
      if (cancelled) return;

      const google = window.google;

      if (!google?.accounts?.id) {
        attempts++;
        if (attempts < maxAttempts) setTimeout(init, 300);
        return;
      }

      // Generate a fresh raw nonce for this session, hash it for Google.
      // Supabase will hash the raw value we send it and compare against
      // the token's nonce claim — they must correspond to the same raw value.
      const rawNonce = crypto.randomUUID();
      const hashedNonce = await sha256Hex(rawNonce);
      nonceRef.current = rawNonce;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        use_fedcm_for_prompt: true,
        nonce: hashedNonce,
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

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
        nonce: nonceRef.current ?? undefined,
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
