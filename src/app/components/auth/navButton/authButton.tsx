"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import AuthModal from "../authModal";
import { useAuth } from "../../../context/authContext";

export default function AuthButton() {
  const { user, status } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();

  const isAuthPage =
    pathname === "/user/profile" || pathname === "/user/library";
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);

  const displayLetter = useMemo(() => {
    if (!user) return "";

    const name = user.displayName?.trim();

    const email = user.email?.split("@")[0] ?? "";

    return (name?.[0] || email?.[0] || "").toUpperCase();
  }, [user]);

  const photoURL = useMemo(() => {
    if (!user?.photoURL) return null;

    const sep = user.photoURL.includes("?") ? "&" : "?";

    return `${user.photoURL}${sep}_t=${user.metadata.lastSignInTime ?? Date.now()}`;
  }, [user]);

  const showPhoto = !!photoURL && !imgError;

  if (!mounted || status === "loading") {
    return (
      <div className="w-9 h-9 rounded-full animate-pulse bg-light-accent dark:bg-dark-accent/30" />
    );
  }

  return (
    <>
      {user ? (
        <Link
          href="/user/profile"
          className="group flex items-center gap-1.5 px-2 py-1 rounded-lg"
        >
          {showPhoto ? (
            <Image
              src={photoURL}
              alt="Profile"
              width={36}
              height={36}
              priority
              className="w-9 h-9 rounded-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="w-9 h-9 rounded-full bg-light-accent dark:bg-dark-accent text-accent-text dark:text-dark-bg flex items-center justify-center text-sm font-medium">
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
        <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
