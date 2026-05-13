"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type ForgotPasswordFormProps = {
  onBack?: () => void;
  onSuccess?: () => void;
};

type ResetPasswordResponse = {
  message?: string;
  error?: string;
};

const RESEND_COOLDOWN = 30;

export default function ForgotPasswordForm({
  onBack,
  onSuccess,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const sendResetEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Email is required.");
      return;
    }

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before sending another email.`);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
        }),
      });

      const data: ResetPasswordResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }

      setSent(true);
      setCooldown(RESEND_COOLDOWN);

      toast.success("Reset email sent successfully.");

      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong.";

      setMessage(errorMessage);

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    await sendResetEmail();
  };

  const handleResend = async () => {
    if (loading || cooldown > 0) return;

    await sendResetEmail();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm w-full bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border"
    >
      <div>
        <h2 className="text-lg font-semibold">Reset Password</h2>

        <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {!sent ? (
        <>
          <label
            htmlFor="reset-email"
            className="text-xs text-light-secondary-text dark:text-dark-secondary-text"
          >
            Email
            <input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="mt-1 w-full border rounded-lg p-2 text-sm
              border-light-border dark:border-dark-border
              bg-light-bg dark:bg-dark-bg
              text-light-body-text dark:text-dark-body-text
              focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium text-sm h-9 flex items-center justify-center
            bg-light-btn-bg text-light-btn-text
            hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
            dark:bg-dark-btn-bg dark:text-dark-btn-text
            dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-3 w-3"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-10 h-10 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-light-accent dark:text-dark-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
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

          <div>
            <p className="text-sm font-medium text-light-body-text dark:text-dark-body-text">
              Check your inbox
            </p>

            <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-0.5">
              We sent a reset link to{" "}
              <span className="font-medium text-light-body-text dark:text-dark-body-text">
                {email}
              </span>
            </p>
          </div>

          <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
            Didn’t get it? Check spam folder.
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className="bg-transparent text-xs font-medium text-light-accent dark:text-dark-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend Email"}
          </button>
        </div>
      )}

      {message && !sent && (
        <p className="text-red-600 dark:text-red-400 text-xs">{message}</p>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="text-xs text-light-accent dark:text-dark-accent hover:underline bg-transparent text-left disabled:opacity-50"
        >
          ← Back to login
        </button>
      )}
    </form>
  );
}
