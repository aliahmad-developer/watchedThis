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
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);

  // Animate modal open/close
  useEffect(() => {
    if (isOpen) setShow(true);
    else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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

  // 🔹 Show temporary messages (like in AuthPage)
  const showMessage = (text: string) => {
    setMessage(text);
    setMessageKey((prev) => prev + 1);
    setTimeout(() => setMessage(""), 5000);
  };

  // 🔹 Match AuthPage verification handler
  const handleSendVerification = async () => {
    if (!user) return;
    setIsSendingVerification(true);
    try {
      await sendEmailVerification(user);
      showMessage("Verification email sent! Check your inbox.");
    } catch (err: any) {
      showMessage(err.message || "Failed to send verification email");
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center 
                 bg-black/60 backdrop-blur-sm"
    >
      <div
        className={`bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-6 w-full max-w-md relative
          transform transition-all duration-300 overflow-y-auto max-h-[90vh]
          ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-transparent absolute top-3 right-3 
                     text-light-secondary-text dark:text-dark-secondary-text 
                     hover:text-light-accent dark:hover:text-dark-accent"
        >
          <FontAwesomeIcon icon={faClose} />
        </button>

        {/* Toggle buttons */}
        <div className="flex justify-around mb-6">
          <button
            onClick={() => setMode("signup")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm
              ${
                mode === "signup"
                  ? "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
                  : "bg-light-bg text-light-secondary-text dark:bg-dark-bg dark:text-dark-secondary-text"
              }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm
              ${
                mode === "login"
                  ? "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
                  : "bg-light-bg text-light-secondary-text dark:bg-dark-bg dark:text-dark-secondary-text"
              }`}
          >
            Login
          </button>
        </div>

        {/* ✅ Updated Email Verification Section (matches AuthPage) */}
        {user && (
          <div className="flex flex-col mb-4">
            <label className="text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text">
              Email
            </label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="mt-1 w-full border rounded-lg p-2 text-xs sm:text-sm
                         border-light-border dark:border-dark-border
                         bg-light-bg dark:bg-dark-bg
                         text-light-body-text dark:text-dark-body-text
                         focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
            />

            {!isVerified ? (
              <button
                onClick={handleSendVerification}
                disabled={isSendingVerification}
                className={`mt-3 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm
                  bg-light-btn-bg text-light-btn-text 
                  hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                  dark:bg-dark-btn-bg dark:text-dark-btn-text
                  dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                  transition-colors
                  ${isSendingVerification ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSendingVerification
                  ? "Sending verification..."
                  : "Send Verification Email"}
              </button>
            ) : (
              <button
                disabled
                className="mt-3 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm
                           bg-green-500 text-white cursor-not-allowed"
              >
                Verified ✓
              </button>
            )}

            {message && (
              <p key={messageKey} className="text-xs text-blue-500 mt-1">
                {message}
              </p>
            )}
          </div>
        )}

        {/* Forms */}
        {mode === "signup" ? (
          <SignupForm onSuccess={onClose} />
        ) : (
          <LoginForm onSuccess={onClose} />
        )}
      </div>
    </div>
  );
}
