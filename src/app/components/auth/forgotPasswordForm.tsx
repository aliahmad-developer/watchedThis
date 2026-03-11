"use client";
import { useState } from "react";
import { forgotPassword } from "./auth";

type ForgotPasswordFormProps = {
  onBack?: () => void;
  onSuccess?: () => void;
};

export default function ForgotPasswordForm({ onBack, onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSent(true);
        setMessage(result.message);
        if (onSuccess) onSuccess();
      } else {
        setMessage(result.message);
      }
    } catch (error: any) {
      setMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm w-full bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">
          Reset Password
        </h2>
        <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {!sent ? (
        <>
          {/* Email */}
          <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
            Email
            <input
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

          {/* Submit */}
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
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </>
      ) : (
        /* Success state */
        <div className="p-3 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
          {message} Check your inbox (and spam folder).
        </div>
      )}

      {/* Error message */}
      {message && !sent && (
        <p className="text-red-600 dark:text-red-400 text-xs">{message}</p>
      )}

      {/* Back link */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-light-accent dark:text-dark-accent hover:underline bg-transparent text-left disabled:opacity-50"
          disabled={loading}
        >
          ← Back to login
        </button>
      )}
    </form>
  );
}