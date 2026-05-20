"use client";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider } from "../../../context/authContext";
import { UserListProvider } from "../../hooks/userListProvider";

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
  const { theme } = useTheme();
  useEffect(() => {
    toast.dismiss();
  }, [theme]);

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

        if (u && !u.emailVerified) {
          if (pollInterval) clearInterval(pollInterval);

          pollInterval = setInterval(async () => {
            if (cancelled) {
              clearInterval(pollInterval!);
              return;
            }
            try {
              await u.reload();
              const refreshed = auth.currentUser;
              if (refreshed?.emailVerified) {
                clearInterval(pollInterval!);
                pollInterval = null;
                const freshToken = await refreshed.getIdToken(true);
                document.cookie = `firebase-auth-token=${freshToken}; path=/; SameSite=Strict; Secure; max-age=3600`;
                router.refresh();
              }
            } catch {}
          }, 3000);
        } else {
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
    <AuthProvider>
      <UserListProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Membership />
          <PushUp />
          <Toaster
            position="bottom-center"
            gutter={6}
            toastOptions={{
              duration: 2000,
              style: {
                borderRadius: "0.75rem",
                padding: "0.6rem 1rem",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
                background: "var(--toast-bg)",
                color: "var(--toast-color)",
                border: "1px solid var(--toast-border)",
                fontSize: "0.875rem",
                maxWidth: "320px",
              },
              success: {
                iconTheme: { primary: "#468189", secondary: "#ffffff" },
              },
              error: {
                iconTheme: { primary: "#d9534f", secondary: "#ffffff" },
              },
            }}
          />
        </ThemeProvider>
      </UserListProvider>
    </AuthProvider>
  );
}
