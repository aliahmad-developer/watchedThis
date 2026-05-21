"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import AuthModal from "../authModal";

type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export default function AuthButton() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [displayLetter, setDisplayLetter] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage =
    pathname === "/user/profile" || pathname === "/user/library";

  const syncUser = useCallback((u: SessionUser | null) => {
    setUser(u);

    if (!u) {
      setPhotoURL(null);
      setDisplayLetter("");
      setImgError(false);
      return;
    }

    // Avoid leaving the <Image> in an error state after a new upload.
    setImgError(false);

    // If server session doesn't yet have photoURL, keep rendering the user
    // but fall back to initials until it appears.
    if (!u.photoURL) {
      setPhotoURL(null);
    } else {
      // Force the browser to refetch the latest photoURL.
      // Also handle the case where the URL already has query params.
      const sep = u.photoURL.includes("?") ? "&" : "?";
      setPhotoURL(`${u.photoURL}${sep}_t=${Date.now()}`);
    }

    const name = u.displayName?.trim();
    const email = u.email?.split("@")[0] ?? "";

    setDisplayLetter((name?.[0] || email?.[0] || "").toUpperCase());
  }, []);

  const syncFromSession = useCallback(async () => {
    try {

      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });


      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }
        console.warn("[AuthButton] /api/auth/me non-ok", body);
        syncUser(null);
        return;
      }

      const data: SessionUser = await res.json();
      syncUser(data);
    } catch (e) {
      console.error("[AuthButton] syncFromSession error", e);
      syncUser(null);
    }
  }, [syncUser]);

  useEffect(() => {
    syncFromSession();

    const handler = () => {
      syncFromSession();
      router.refresh();
    };

    window.addEventListener("auth-updated", handler);
    return () => window.removeEventListener("auth-updated", handler);
  }, [syncFromSession, router]);

  const showPhoto = !!photoURL && !imgError;

  return (
    <>
      {user ? (
        <Link
          href="/user/profile"
          className="group flex items-center gap-1.5 px-2 py-1 rounded-lg"
        >
          {showPhoto ? (
            <Image
              src={photoURL!}
              alt="Profile"
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="w-9 h-9 text-accent-text dark:text-dark-bg flex items-center justify-center rounded-full bg-light-accent dark:bg-dark-accent text-sm font-medium">
              {displayLetter}
            </span>
          )}
        </Link>
      ) : (
        <button
          onClick={() => !isAuthPage && setModalOpen(true)}
          className="px-2 text-sm"
        >
          Login
        </button>
      )}

      {modalOpen && (
        <AuthModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            syncFromSession();
            router.refresh();
          }}
        />
      )}
    </>
  );
}
