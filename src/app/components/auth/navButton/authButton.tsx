"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthModal from "../authModal";
import { auth } from "../../../firebase/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [displayLetter, setDisplayLetter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  // ✅ Listen for auth state changes and auto-refresh displayName
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Refresh user data to get latest displayName
        await currentUser.reload();
        const updatedUser = auth.currentUser;

        setUser(updatedUser);
        if (updatedUser) {
          const name = updatedUser.displayName?.trim();
          const email = updatedUser.email?.split("@")[0] || "";
          const letter = name
            ? name.charAt(0).toUpperCase()
            : email.charAt(0).toUpperCase();
          setDisplayLetter(letter);
        }
      } else {
        setUser(null);
        setDisplayLetter("");
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Recalculate letter whenever displayName or email changes
  useEffect(() => {
    if (user) {
      const name = user.displayName?.trim();
      const email = user.email?.split("@")[0] || "";
      const letter = name
        ? name.charAt(0).toUpperCase()
        : email.charAt(0).toUpperCase();
      setDisplayLetter(letter);
    } else {
      setDisplayLetter("");
    }
  }, [user?.displayName, user?.email]);

  const handleClick = () => {
    if (!user && !isAuthPage) setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  return (
    <>
      {user ? (
        <Link href="/auth">
          <span
            className={`px-4 py-1.5 rounded-lg text-md font-bold transition-colors max-w-[140px] truncate
    ${
      isAuthPage
        ? "bg-light-accent dark:bg-dark-accent text-white dark:text-dark-card shadow-md"
        : "font-bold bg-transparent text-light-btn-text dark:text-secondary-text hover:text-light-accent dark:hover:text-dark-btn-hover-bg transition-colors duration-200 ease-in-out"
    }`}
            title={user.displayName || user.email || ""}
          >
            {displayLetter}
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
      {modalOpen && <AuthModal isOpen={modalOpen} onClose={handleModalClose} />}
    </>
  );
}
