"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import AuthModal from "../authModal";
import { auth } from "../../../firebase/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [displayLetter, setDisplayLetter] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === "/user/profile" || pathname === "/user/library";

  const syncUser = (u: User | null) => {
    if (!u) return;
    setUser(u);
    setImgError(false);
    setPhotoURL(u.photoURL ?? null);
    const name = u.displayName?.trim();
    const email = u.email?.split("@")[0] || "";
    setDisplayLetter((name ? name.charAt(0) : email.charAt(0)).toUpperCase());
  };

  const forceReload = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    syncUser(auth.currentUser);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await currentUser.reload();
        syncUser(auth.currentUser);
      } else {
        setUser(null);
        setDisplayLetter("");
        setPhotoURL(null);
      }
    });

    // Fired by ProfilePictureUpdate after Cloudinary upload + updateProfile,
    // and by SignupForm after updateProfile sets displayName
    window.addEventListener("signup-username-ready", forceReload);

    return () => {
      unsubscribe();
      window.removeEventListener("signup-username-ready", forceReload);
    };
  }, []);

  // Re-sync when profile changes externally
  useEffect(() => {
    if (user) syncUser(user);
  }, [user?.displayName, user?.email, user?.photoURL]);

  const showPhoto = !!photoURL && !imgError;

  const avatar = showPhoto ? (
    <Image
      src={photoURL!}
      alt="Profile"
      width={36}
      height={36}
      className="rounded-full object-cover w-9 h-9 ring-2 ring-transparent group-hover:ring-light-accent dark:group-hover:ring-dark-accent transition-all duration-200"
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
      bg-light-accent/15 dark:bg-dark-accent/15
      text-light-accent dark:text-dark-accent
      ring-2 ring-light-accent/30 dark:ring-dark-accent/30
      group-hover:ring-light-accent dark:group-hover:ring-dark-accent
      transition-all duration-200">
      {displayLetter}
    </span>
  );

  return (
    <>
      {user ? (
        <Link
          href="/user/profile"
          className="group flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-light-accent/8 dark:hover:bg-dark-accent/8"
          title={user.displayName || user.email || ""}
        >
          {avatar}
        </Link>
      ) : (
        <button
          onClick={() => { if (!isAuthPage) setModalOpen(true); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${isAuthPage
              ? "bg-light-accent dark:bg-dark-accent text-white dark:text-dark-card shadow-md cursor-default"
              : "bg-transparent text-light-btn-text dark:text-white hover:text-light-accent dark:hover:text-dark-accent"
            }`}
        >
          Login
        </button>
      )}

      {modalOpen && <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </>
  );
}