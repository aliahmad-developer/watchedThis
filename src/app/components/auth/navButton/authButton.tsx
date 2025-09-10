"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AuthModal from "../authModal";
import { auth } from "../../../firebase/firebaseConfig";
import { User, onAuthStateChanged, sendEmailVerification } from "firebase/auth";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const truncateUsername = (
    name: string | undefined | null,
    maxLength: number = 8
  ) => {
    if (!name) return "";
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  const handleClick = () => {
    if (!user) setModalOpen(true);
  };

  return (
    <>
      {user ? (
        <Link href="/auth">
          <span
            className="bold px-4 py-1.5 bg-transparent rounded-lg text-sm font-medium 
                      text-light-btn-text 
                     hover:text-light-accent dark:hover:text-dark-accent
                     dark:text-white
                    dark:hover:text-dark-accent
                     transition-colors
                       max-w-[140px] truncate"
            title={
              user.displayName
                ? user.displayName
                : user.email?.split("@")[0] || ""
            }
          >
            {truncateUsername(
              user.displayName
                ? user.displayName
                : user.email?.split("@")[0] || ""
            )}
          </span>
        </Link>
      ) : (
        <button
          onClick={handleClick}
          className="bold px-4 py-1.5 bg-transparent rounded-lg text-sm font-medium 
                      text-light-btn-text 
                     hover:text-light-accent dark:hover:text-dark-accent
                     dark:text-white
                    dark:hover:text-dark-accent
                     transition-colors"
        >
          Login
        </button>
      )}

      {/* Auth Modal */}
      {modalOpen && (
        <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
