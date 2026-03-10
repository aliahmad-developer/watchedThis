"use client";
import LoginForm from "./loginForm";
import SignupForm from "./signUpForm";
import ForgotPasswordForm from "./forgotPasswordForm";
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
  const [mode, setMode] = useState<"signup" | "login" | "forgot">("signup");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);

  useEffect(() => {
    if (isOpen) setShow(true);
    else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setMode("signup");
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setIsVerified(u?.emailVerified ?? false);
    });
    return () => unsubscribe();
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    setMessageKey((prev) => prev + 1);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleSendVerification = async () => {
    if (!user) return;
    setIsSendingVerification(true);
    try {
      await sendEmailVerification(user);
      showMessage("Verification email sent! Check your inbox.");
    } catch (err: any) {
      throw err;
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — sits at bottom on mobile, centered on desktop */}
      <div
        className={[
          "fixed z-[10000] bg-light-card dark:bg-dark-card shadow-xl",
          // Mobile: fixed to bottom, full width, rounded top corners
          "bottom-0 left-0 right-0 rounded-t-2xl",
          // Desktop: centered modal
          "sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-full sm:max-w-md",
          "overflow-y-auto max-h-[90dvh] sm:max-h-[90vh]",
          "p-4 sm:p-6",
          "transition-transform duration-300",
          isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-[-40%]",
        ].join(" ")}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-transparent absolute top-3 right-3 p-1
                     text-light-secondary-text dark:text-dark-secondary-text
                     hover:text-light-accent dark:hover:text-dark-accent"
        >
          <FontAwesomeIcon icon={faClose} className="w-4 h-4" />
        </button>

        {/* Tabs */}
        {mode !== "forgot" && (
          <div className="flex mb-4 border-b border-light-border dark:border-dark-border">
            {(["signup", "login"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={[
                  "flex-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px bg-transparent",
                  mode === tab
                    ? "border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent"
                    : "border-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text",
                ].join(" ")}
              >
                {tab === "signup" ? "Sign Up" : "Login"}
              </button>
            ))}
          </div>
        )}

        {/* Email verification banner */}
        {user && !isVerified && mode !== "forgot" && (
          <div className="flex flex-col gap-2 mb-4 p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
            <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
              Signed in as{" "}
              <span className="font-medium text-light-body-text dark:text-dark-body-text">
                {user.email}
              </span>
            </p>
            <button
              onClick={handleSendVerification}
              disabled={isSendingVerification}
              className="w-full h-8 px-3 rounded-md font-medium text-xs
                         bg-light-btn-bg text-light-btn-text
                         hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                         dark:bg-dark-btn-bg dark:text-dark-btn-text
                         dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSendingVerification ? "Sending..." : "Send Verification Email"}
            </button>
            {message && (
              <p key={messageKey} className="text-xs text-light-accent dark:text-dark-accent">
                {message}
              </p>
            )}
          </div>
        )}

        {/* Forms */}
        {mode === "signup" && (
          <SignupForm
            onSuccess={onClose}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
        {mode === "login" && (
          <LoginForm
            onSuccess={onClose}
            onForgotPassword={() => setMode("forgot")}
            onSwitchToSignup={() => setMode("signup")}
          />
        )}
        {mode === "forgot" && (
          <ForgotPasswordForm
            onBack={() => setMode("login")}
            onSuccess={() => {
              showMessage("Password reset email sent! Check your inbox.");
              setTimeout(() => setMode("login"), 2000);
            }}
          />
        )}
      </div>
    </>
  );
}