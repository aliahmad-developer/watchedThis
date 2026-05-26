"use client";

import { useEffect, useRef, useState } from "react";
import { resendVerificationEmail } from "./auth";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

type Props = {
  email: string;
  password: string;
  username: string;
  onClose: () => void;
  onSwitchToLogin?: () => void;
};

const RESEND_COOLDOWN = 30;
const CIRCUMFERENCE = 69.1;

export default function VerifyEmailModal({
  email,
  password,
  username,
  onClose,
  onSwitchToLogin,
}: Props) {
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const [resendMessage, setResendMessage] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startCountdown();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(RESEND_COOLDOWN);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          setCanResend(true);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!canResend || resending) return;

    setResending(true);
    setResendStatus("idle");
    setResendMessage("");

    try {
      const result = await resendVerificationEmail(email, password, username);

      if (result.success) {
        setResendStatus("success");
        setResendMessage("Verification email sent successfully.");

        toast.success("Verification email resent.");

        startCountdown();
      } else {
        setResendStatus("error");
        setResendMessage(
          result.message || "Failed to resend verification email.",
        );

        toast.error(result.message || "Failed to resend verification email.");
      }
    } catch {
      setResendStatus("error");
      setResendMessage("Something went wrong. Please try again.");

      toast.error("Something went wrong.");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = (() => {
    const [local, domain] = email.split("@");

    if (!domain) return email;

    return `${local.slice(0, 2)}${"*".repeat(
      Math.max(local.length - 2, 3),
    )}@${domain}`;
  })();

  const strokeOffset = CIRCUMFERENCE * (1 - countdown / RESEND_COOLDOWN);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
        relative
        w-full
        max-w-82.5
        rounded-[20px]
        border border-light-border dark:border-dark-border
        bg-light-card dark:bg-dark-card
        shadow-2xl
        px-4 py-4
        sm:px-5 sm:py-5
      "
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="
          absolute top-3 right-3
          w-7 h-7
          rounded-full
          flex items-center justify-center
          border border-light-border dark:border-dark-border
          bg-light-bg/80 dark:bg-dark-bg/80
          text-light-secondary-text dark:text-dark-secondary-text
          hover:bg-light-border dark:hover:bg-dark-border
          transition-colors
        "
        >
          <FontAwesomeIcon icon={faClose} size="sm" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className="
            w-11 h-11
            rounded-full
            flex items-center justify-center
            bg-light-accent/10 dark:bg-dark-accent/10
            mb-3
          "
          >
            <svg
              className="
              w-4.5 h-4.5
              text-light-accent dark:text-dark-accent
            "
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.9}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2
            className="
            text-[1.35rem]
            leading-tight
            font-semibold
            text-light-body-text dark:text-dark-body-text
          "
          >
            Verify your email
          </h2>

          {/* Text */}
          <p
            className="
            mt-2
            text-[0.83rem]
            leading-relaxed
            text-light-secondary-text dark:text-dark-secondary-text
          "
          >
            We sent a verification link to
          </p>

          {/* Email */}
          <p
            className="
            mt-2
            text-[0.92rem]
            font-semibold
            break-all
            text-light-body-text dark:text-dark-body-text
          "
          >
            {maskedEmail}
          </p>

          <p
            className="
            mt-3
            text-[0.82rem]
            leading-relaxed
            text-light-secondary-text dark:text-dark-secondary-text
            max-w-65
          "
          >
            Click the link in your inbox to complete your account setup.
          </p>
          {/* Countdown */}
          {!canResend && (
            <div className="mt-3 flex items-center gap-2">
              <div
                className="
                relative
                w-7 h-7
                flex items-center justify-center
                shrink-0
              "
              >
                <svg
                  className="absolute inset-0 w-7 h-7 -rotate-90"
                  viewBox="0 0 28 28"
                >
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    strokeWidth="2"
                    className="stroke-light-border dark:stroke-dark-border"
                  />

                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeOffset}
                    className="
                    stroke-light-accent dark:stroke-dark-accent
                    transition-[stroke-dashoffset]
                    duration-1000
                    linear
                  "
                  />
                </svg>

                <span
                  className="
                  m-0
                  relative inset-0
                  flex items-center justify-center
                  text-[9px]
                  font-semibold
                  leading-none
                  text-light-secondary-text dark:text-dark-secondary-text
                "
                >
                  {countdown}
                </span>
              </div>

              <span
                className="
                text-[0.8rem]
                text-light-secondary-text dark:text-dark-secondary-text
              "
              >
                Resend in {countdown}s
              </span>
            </div>
          )}

          {/* Button */}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resending}
            className="
            mt-4
            w-full
            h-10.5
            rounded-xl
            font-medium
            text-[0.85rem]
            flex items-center justify-center gap-2
            overflow-hidden
            transition-all duration-200

            bg-light-btn-bg text-light-btn-text
            hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text

            dark:bg-dark-btn-bg dark:text-dark-btn-text
            dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text

            disabled:opacity-50
            disabled:cursor-not-allowed
          "
          >
            {resending ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>

                <span className="whitespace-nowrap">Sending...</span>
              </>
            ) : (
              "Resend Email"
            )}
          </button>

          {/* Footer */}
          <div
            className="
            w-full
            mt-5
            pt-4
            border-t border-light-border dark:border-dark-border
            flex flex-col items-center gap-2
          "
          >
            <button
              type="button"
              onClick={onClose}
              className="
              text-[0.82rem]
              font-medium
              text-light-accent dark:text-dark-accent
              hover:underline
              bg-transparent
            "
            >
               Back
            </button>

            {onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="
                text-[0.82rem]
                font-medium
                text-light-accent dark:text-dark-accent
                hover:underline
                bg-transparent
              "
              >
                Already verified? Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
