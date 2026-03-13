"use client";
import { createPortal } from "react-dom";
import LoginForm from "./loginForm";
import SignupForm from "./signUpForm";
import ForgotPasswordForm from "./forgotPasswordForm";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { auth, sendEmailVerification } from "../../firebase/firebaseConfig";
import { checkRedirectResult } from "./auth";
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

  // ── Drag state ────────────────────────────────────────────
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);

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
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
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

  useEffect(() => {
    checkRedirectResult().then((result) => {
      if (result.success && result.user) onClose();
    });
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

  // ── Drag handlers ─────────────────────────────────────────
  const onDragStart = (clientY: number) => {
    // Only initiate drag from near the top of the sheet (handle area)
    isDragging.current = true;
    dragStartY.current = clientY;
    dragCurrentY.current = clientY;
    setIsSnapping(false);
  };

  const onDragMove = (clientY: number) => {
    if (!isDragging.current) return;
    dragCurrentY.current = clientY;
    const delta = clientY - dragStartY.current;
    // Resist dragging upward (rubber band feel)
    const offset = delta > 0 ? delta : delta * 0.15;
    setDragOffset(offset);
  };

  const onDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = dragCurrentY.current - dragStartY.current;

    setIsSnapping(true);
    if (delta > 120) {
      // Dismiss — let it fly off screen then call onClose
      const sheetHeight = sheetRef.current?.offsetHeight ?? 500;
      setDragOffset(sheetHeight + 40);
      setTimeout(() => {
        onClose();
        setDragOffset(0);
        setIsSnapping(false);
      }, 320);
    } else {
      // Snap back
      setDragOffset(0);
      setTimeout(() => setIsSnapping(false), 320);
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) =>
    onDragStart(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) =>
    onDragMove(e.touches[0].clientY);
  const handleTouchEnd = () => onDragEnd();

  // Mouse events (for desktop testing)
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
            <p
              key={messageKey}
              className="text-xs text-light-accent dark:text-dark-accent"
            >
              {message}
            </p>
          )}
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
          onSuccess={() => {
            showMessage("Password reset email sent! Check your inbox.");
            setTimeout(() => setMode("login"), 2000);
          }}
        />
      )}
    </div>
  );

  if (!show) return null;

  // Backdrop opacity dims as you drag the sheet down
  const backdropOpacity = Math.max(0, 1 - dragOffset / 300);

  const modal = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ zIndex: 9998, opacity: isOpen ? backdropOpacity : 0 }}
        onClick={onClose}
      />

      {/* ── MOBILE: draggable bottom sheet ── */}
      <div
        ref={sheetRef}
        className={[
          "fixed bottom-0 left-0 right-0 sm:hidden",
          "bg-light-card dark:bg-dark-card shadow-xl rounded-t-2xl",
          "px-4 pt-3 pb-6 overflow-y-auto max-h-[90dvh]",
          // Transition only when snapping, not while dragging
          isSnapping ? "transition-transform duration-300 ease-out" : "",
          // Slide up on open, slide down on close (when not being dragged)
          !isDragging.current && !isSnapping
            ? isOpen
              ? "translate-y-0"
              : "translate-y-full"
            : "",
        ].join(" ")}
        style={{
          zIndex: 9999,
          transform: `translateY(${
            // If dragging or snapping, use dragOffset; otherwise CSS classes handle it
            isDragging.current || isSnapping
              ? `${dragOffset}px`
              : isOpen
                ? "0"
                : "100%"
          })`,
          willChange: "transform",
        }}
      >
        {/* ── Drag handle — attach all drag listeners here ── */}
        <div
          className="flex justify-center mb-3 cursor-grab active:cursor-grabbing select-none py-1"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div
            className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border transition-all duration-150"
            style={{
              // Pill widens slightly when dragging — subtle tactile feedback
              width: isDragging.current ? "3rem" : "2.5rem",
              opacity: isDragging.current ? 0.8 : 1,
            }}
          />
        </div>

        <button
          onClick={onClose}
          className="bg-transparent absolute top-3 right-3 p-1
                     text-light-secondary-text dark:text-dark-secondary-text
                     hover:text-light-accent dark:hover:text-dark-accent"
        >
          <FontAwesomeIcon icon={faClose} className="w-4 h-4" />
        </button>

        {innerContent}
      </div>

      {/* ── DESKTOP: slide-up + fade-in centered card ── */}
      <div
        className="fixed hidden sm:flex inset-0 overflow-y-auto"
        style={{ zIndex: 9999 }}
        onClick={onClose}
      >
        <div className="flex w-full justify-center py-20 px-4">
          <div
            className={[
              "relative w-full max-w-md h-fit",
              "bg-light-card dark:bg-dark-card rounded-xl shadow-xl p-6",
              "transition-all duration-500 ease-out",
              isOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="bg-transparent absolute top-3 right-3 p-1
                         text-light-secondary-text dark:text-dark-secondary-text
                         hover:text-light-accent dark:hover:text-dark-accent"
            >
              <FontAwesomeIcon icon={faClose} className="w-4 h-4" />
            </button>
            {innerContent}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
