"use client";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Membership = dynamic(() => import("../../MemberShips/paid"), {
  ssr: false,
});
const PushUp = dynamic(() => import("../backToTop"), { ssr: false });

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Orientation classes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: landscape)");

    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const isLandscape = e.matches;
      document.body.classList.toggle("landscape", isLandscape);
      document.body.classList.toggle("portrait", !isLandscape);
    };

    handler(mediaQuery);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Auth token cookie sync + email verification poller
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: any;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const firebaseAuth = await import("firebase/auth");
      const firebaseConfig = await import("../../../firebase/firebaseConfig");
      const auth = await firebaseConfig.getFirebaseAuth();

      unsubscribe = firebaseAuth.onIdTokenChanged(auth, async (u: any) => {
        if (cancelled) return;

        if (u) {
          const token = await u.getIdToken();
          document.cookie = `firebase-auth-token=${token}; path=/; SameSite=Strict; Secure; max-age=3600`;

          // If the user is logged in but not yet email-verified,
          // poll in the background — the browser tab may complete
          // verification at any moment (e.g. PWA flow)
          if (!u.emailVerified) {
            if (pollInterval) clearInterval(pollInterval);

            pollInterval = setInterval(async () => {
              if (cancelled) {
                clearInterval(pollInterval!);
                return;
              }

              try {
                await u.reload(); // fetch latest state from Firebase

                // u.reload() mutates the object — re-read from auth.currentUser
                const refreshed = auth.currentUser;

                if (refreshed?.emailVerified) {
                  clearInterval(pollInterval!);
                  pollInterval = null;

                  // Force a token refresh so the cookie reflects verified state
                  const freshToken = await refreshed.getIdToken(true);
                  document.cookie = `firebase-auth-token=${freshToken}; path=/; SameSite=Strict; Secure; max-age=3600`;

                  // Re-render the current route so auth-gated UI updates
                  router.refresh();
                }
              } catch {
                // network blip — will retry on next tick
              }
            }, 3000);
          } else {
            // Already verified — clear any stale poller
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          }
        } else {
          document.cookie = `firebase-auth-token=; path=/; max-age=0; SameSite=Strict; Secure`;

          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      });
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [router]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Membership />
      <PushUp />
      <Toaster
        position="bottom-center"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
          },
          className:
            "bg-light-card text-light-body-text border border-light-border dark:bg-dark-card dark:text-dark-body-text dark:border-dark-border",
          success: {
            iconTheme: { primary: "#468189", secondary: "#ffffff" },
            className:
              "bg-light-card text-light-body-text border border-light-border dark:bg-dark-card dark:text-dark-body-text dark:border-dark-border",
          },
          error: {
            iconTheme: { primary: "#d9534f", secondary: "#ffffff" },
            className:
              "bg-light-card text-light-body-text border border-light-border dark:bg-dark-card dark:text-dark-body-text dark:border-dark-border",
          },
        }}
      />
    </ThemeProvider>
  );
}
