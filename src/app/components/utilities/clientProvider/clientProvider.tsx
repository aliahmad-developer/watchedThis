"use client";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

const Membership = dynamic(() => import("../../MemberShips/paid"), {
  ssr: false,
});
const PushUp = dynamic(() => import("../backToTop"), { ssr: false });

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = () => {
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      document.body.classList.toggle("landscape", isLandscape);
      document.body.classList.toggle("portrait", !isLandscape);
    };
    handler();
    window.addEventListener("orientationchange", handler);
    return () => window.removeEventListener("orientationchange", handler);
  }, []);
  
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: any;
    (async () => {
      const firebaseAuth = await import("firebase/auth");
      const firebaseConfig = await import("../../../firebase/firebaseConfig");
      const auth = await firebaseConfig.getFirebaseAuth();
      unsubscribe = firebaseAuth.onIdTokenChanged(auth, async (u: any) => {
        if (u) {
          const token = await u.getIdToken();
          document.cookie = `firebase-auth-token=${token}; path=/; SameSite=Strict; Secure; max-age=3600`;
        } else {
          document.cookie = `firebase-auth-token=; path=/; max-age=0; SameSite=Strict; Secure`;
        }
      });
    })();
    return () => {
      if (unsubscribe) unsubscribe();
      cancelled = true;
    };
  }, []);

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
