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
import { createClient } from "@/lib/supabase/client";

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
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user || user.email_confirmed_at) return;

      pollInterval = setInterval(async () => {
        if (cancelled) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
        try {
          const {
            data: { user: refreshed },
          } = await supabase.auth.getUser();
          if (refreshed?.email_confirmed_at) {
            if (pollInterval) clearInterval(pollInterval);
            pollInterval = null;
            router.refresh();
          }
        } catch {}
      }, 3000);
    });

    return () => {
      cancelled = true;
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
