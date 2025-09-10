"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthModal from "../authModal";
import { auth } from "../../../firebase/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

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
    if (!user && !isAuthPage) setModalOpen(true);
  };

  return (
    <>
      {user ? (
        <Link href="/auth">
          <span
            className={`px-4 py-1.5 rounded-lg text-md font-medium transition-colors max-w-[140px] truncate
              ${
                isAuthPage
                  ? "bg-light-accent dark:bg-dark-accent text-white dark:text-dark-card shadow-md"
                  : "bg-transparent text-light-btn-text dark:text-white hover:text-light-accent dark:hover:text-dark-accent"
              }`}
            title={
              user.displayName
                ? user.displayName.charAt(0).toUpperCase() +
                  user.displayName.slice(1).toLowerCase()
                : user.email?.split("@")[0] || ""
            }
          >
            {truncateUsername(
              user.displayName
                ? user.displayName.charAt(0).toUpperCase() +
                    user.displayName.slice(1).toLowerCase()
                : user.email?.split("@")[0] || ""
            )}
          </span>
        </Link>
      ) : (
        <button
          onClick={handleClick}
          className={`px-4 py-1.5 rounded-lg text-md font-medium transition-colors
            ${
              isAuthPage
                ? "bg-light-accent dark:bg-dark-accent text-white dark:text-dark-card shadow-md cursor-default"
                : "bg-transparent text-light-btn-text dark:text-white hover:text-light-accent dark:hover:text-dark-accent"
            }`}
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
