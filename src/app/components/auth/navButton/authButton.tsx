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
    if (!u) {
      setUser(null);
      setPhotoURL(null);
      setDisplayLetter("");
      setImgError(false);
      return;
    }

    setUser(u);
    setImgError(false);
    setPhotoURL(u.photoURL ?? null);

    const name = u.displayName?.trim();
    const email = u.email?.split("@")[0] ?? "";
    setDisplayLetter((name ? name.charAt(0) : email.charAt(0)).toUpperCase());
  }, []);

  const syncFromSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        syncUser(null);
        return;
      }

      const data: SessionUser = await res.json();
      syncUser(data);
    } catch {
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
            <span className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
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
