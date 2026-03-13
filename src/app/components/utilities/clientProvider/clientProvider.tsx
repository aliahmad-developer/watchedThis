"use client";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";

const Membership = dynamic(() => import("../../MemberShips/paid"), {
  ssr: false,
});
const PushUp = dynamic(() => import("../../utilities/pushUp"), { ssr: false });
import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../../../firebase/firebaseConfig";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Token refresh lives here — runs once for the whole app
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (u) => {
      if (u) {
        const token = await u.getIdToken();
        document.cookie = `firebase-auth-token=${token}; path=/; SameSite=Strict; Secure; max-age=3600`;
      } else {
        document.cookie = `firebase-auth-token=; path=/; max-age=0; SameSite=Strict; Secure`;
      }
    });
    return () => unsubscribe();
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
            "bg-light-card text-light-accent border border-light-border dark:bg-dark-card dark:text-dark-accent dark:border-dark-border",
          success: {
            iconTheme: { primary: "#b85c7a", secondary: "#fff" },
            className:
              "bg-light-card text-light-accent border border-light-border dark:bg-dark-card dark:text-dark-accent dark:border-dark-border",
          },
          error: {
            iconTheme: { primary: "#d9534f", secondary: "#fff" },
            className:
              "bg-light-card text-light-accent border border-light-border dark:bg-dark-card dark:text-dark-accent dark:border-dark-border",
          },
        }}
      />
    </ThemeProvider>
  );
}
