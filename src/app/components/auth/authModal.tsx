"use client";
import LoginForm from "./loginForm";
import SignupForm from "./signUpForm";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { auth, sendEmailVerification } from "../../firebase/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  // Animate modal open/close
  useEffect(() => {
    if (isOpen) setShow(true);
    else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setIsVerified(u.emailVerified);
      } else {
        setUser(null);
        setIsVerified(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSendVerification = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setVerificationMessage("Verification email sent! Check your inbox.");
    } catch (err: any) {
      setVerificationMessage(err.message);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-6 w-full max-w-md relative
          transform transition-all duration-300
          ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-transparent absolute top-3 right-3 text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
        >
          <FontAwesomeIcon icon={faClose} />
        </button>

        {/* Toggle buttons */}
        <div className="flex justify-around mb-6">
          <button
            onClick={() => setMode("signup")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm
              ${mode === "signup"
                ? "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
                : "bg-light-bg text-light-secondary-text dark:bg-dark-bg dark:text-dark-secondary-text"
              }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm
              ${mode === "login"
                ? "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
                : "bg-light-bg text-light-secondary-text dark:bg-dark-bg dark:text-dark-secondary-text"
              }`}
          >
            Login
          </button>
        </div>

        {/* Email verification button */}
        {user && (
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="mt-1 w-full border rounded-lg p-2 text-sm
                         border-light-border dark:border-dark-border
                         bg-light-bg dark:bg-dark-bg
                         text-light-body-text dark:text-dark-body-text
                         focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
            />
            {isVerified ? (
              <button
                className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm cursor-not-allowed"
                disabled
              >
                Verified
              </button>
            ) : (
              <button
                onClick={handleSendVerification}
                className="px-3 py-2 rounded-lg bg-yellow-500 text-black text-sm hover:bg-yellow-400 transition-colors"
              >
                Verify Email
              </button>
            )}
            {verificationMessage && (
              <p className="text-xs text-blue-500">{verificationMessage}</p>
            )}
          </div>
        )}

        {/* Forms */}
        {mode === "signup" ? <SignupForm onSuccess={onClose} /> : <LoginForm onSuccess={onClose} />}
      </div>
    </div>
  );
}
