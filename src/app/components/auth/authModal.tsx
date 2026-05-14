"use client";
import { createPortal } from "react-dom";
import LoginForm from "./loginForm";
import SignupForm from "./signUpForm";
import ForgotPasswordForm from "./forgotPasswordForm";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { checkRedirectResult } from "./auth";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";

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
  const [cooldown, setCooldown] = useState(0);
  const [auth, setAuth] = useState<any>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const firebase = await import("../../firebase/firebaseConfig");
        const { getFirebaseAuth } = firebase;
        const authInstance = await getFirebaseAuth();
        setAuth(authInstance);

        unsubscribe = onAuthStateChanged(authInstance, (u) => {
          setUser(u ?? null);
          setIsVerified(u?.emailVerified ?? false);
        });
      } catch (err) {
        console.error("Auth init failed:", err);
      }
    };

    init();
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendVerification = async () => {
    if (!user?.email || cooldown > 0) return;

    setIsSendingVerification(true);
    try {
      const res = await fetch("/api/auth/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Verification email sent! Check your inbox.");
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification email.");
      setCooldown(60);
    } finally {
      setIsSendingVerification(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setDragOffset(0);
    } else {
      const timer = setTimeout(() => setShow(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (isOpen) setMode("signup");
  }, [isOpen]);

  useEffect(() => {
    checkRedirectResult()
      .then((result) => {
        if (result.success && result.user) onClose();
      })
      .catch(console.error);
  }, [onClose]);

  if (!isOpen || !show) return null;

  const onDragStart = (clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    dragCurrentY.current = clientY;
    setIsSnapping(false);
  };

  const onDragMove = (clientY: number) => {
    if (!isDragging.current) return;
    dragCurrentY.current = clientY;
    const delta = clientY - dragStartY.current;
    const offset = delta > 0 ? delta : delta * 0.15;
    setDragOffset(offset);
  };

  const onDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = dragCurrentY.current - dragStartY.current;

    setIsSnapping(true);
    if (delta > 120) {
      const sheetHeight = sheetRef.current?.offsetHeight ?? 500;
      setDragOffset(sheetHeight + 40);
      setTimeout(() => {
        onClose();
        setDragOffset(0);
        setIsSnapping(false);
      }, 320);
    } else {
      setDragOffset(0);
      setTimeout(() => setIsSnapping(false), 320);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) =>
    onDragStart(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) =>
    onDragMove(e.touches[0].clientY);
  const handleTouchEnd = () => onDragEnd();

  const handleMouseDown = (e: React.MouseEvent) => {
    onDragStart(e.clientY);
    const onMove = (ev: MouseEvent) => onDragMove(ev.clientY);
    const onUp = () => {
      onDragEnd();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const innerContent = (
    <div className="w-full max-w-sm mx-auto">
      {mode !== "forgot" && (
        <div className="flex mb-4 border-b border-light-border dark:border-dark-border pb-2">
          {(["signup", "login"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`
                flex-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px bg-transparent rounded-none
                ${
                  mode === tab
                    ? "border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent shadow-sm"
                    : "border-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text hover:border-light-border/50 dark:hover:border-dark-border/50"
                }
              `}
            >
              {tab === "signup" ? "Sign Up" : "Login"}
            </button>
          ))}
        </div>
      )}

      {user && !isVerified && mode !== "forgot" && (
        <div className="flex flex-col gap-2 mb-4 p-3 rounded-lg bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50">
          <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
            Signed in as{" "}
            <span className="font-medium text-light-body-text dark:text-dark-body-text">
              {user.email}
            </span>
          </p>
          <button
            onClick={handleSendVerification}
            disabled={isSendingVerification || cooldown > 0}
            className="w-full h-8 px-3 rounded-md font-medium text-xs bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSendingVerification
              ? "Sending..."
              : cooldown > 0
                ? `Wait ${cooldown}s`
                : "Resend Verification Email"}
          </button>
        </div>
      )}

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
          onSuccess={() =>
            toast.success("Password reset email sent! Check your inbox.")
          }
        />
      )}
    </div>
  );

  const backdropOpacity = Math.max(0, 1 - dragOffset / 300);

  const modal = (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        style={{ opacity: backdropOpacity }}
        onClick={onClose}
      />
      {/* Mobile: Bottom sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-light-card dark:bg-dark-card rounded-t-3xl shadow-2xl  overflow-hidden max-h-[90vh]"
        style={{
          transform: `translateY(${isDragging.current || isSnapping ? dragOffset : isOpen ? 0 : 100}%)`,
          transition: isSnapping
            ? "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "none",
        }}
      >
        <div
          className="flex justify-center p-3 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-8 h-1.5 bg-light-border/60 dark:bg-dark-border/60 rounded-full shadow-sm transition-all duration-200 hover:w-10" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm hover:bg-light-card dark:hover:bg-dark-card transition-all z-10"
          aria-label="Close modal"
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="w-4 h-4 text-light-secondary-text dark:text-dark-secondary-text"
          />
        </button>

        <div className="p-4 pb-8 overflow-y-auto">{innerContent}</div>
      </div>
      // Desktop: Centered dialog
      <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <div
          className="relative w-full max-w-md bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-6 transition-all duration-300"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen
              ? "scale(1) translateY(0)"
              : "scale(0.95) translateY(-10px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm hover:bg-light-card dark:hover:bg-dark-card transition-all z-10"
            aria-label="Close modal"
          >
            <FontAwesomeIcon
              icon={faXmark}
              className="w-4 h-4 text-light-secondary-text dark:text-dark-secondary-text"
            />
          </button>
          {innerContent}
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
