"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const oobCode = searchParams.get("oobCode");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setMessage("Invalid or expired reset link.");
      setIsError(true);
    }
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const { getFirebaseAuth } = await import("@/app/firebase/firebaseConfig");
      const { confirmPasswordReset } = await import("firebase/auth");

      const auth = await getFirebaseAuth();
      await confirmPasswordReset(auth, oobCode, newPassword);

      setIsDone(true);
      setMessage("Password updated successfully!");
      setTimeout(() => router.push("/user/profile"), 2000);
    } catch (err: any) {
      setIsError(true);
      if (err.code === "auth/expired-action-code") {
        setMessage("This reset link has expired. Please request a new one.");
      } else if (err.code === "auth/invalid-action-code") {
        setMessage("This reset link is invalid or already used.");
      } else {
        setMessage(err.message || "Failed to reset password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-light-bg dark:bg-dark-bg">
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h1 className="text-lg font-semibold text-light-header dark:text-dark-header mb-1">
          Set new password
        </h1>
        <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mb-5">
          Choose a strong password for your account.
        </p>

        {isDone ? (
          <div className="p-3 rounded-lg bg-light-bg dark:bg-dark-bg border-l-2 border-light-accent dark:border-dark-accent text-xs text-light-body-text dark:text-dark-body-text">
            {message} Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading || !!isError}
                placeholder="Min. 6 characters"
                className="mt-1 w-full border rounded-lg px-2.5 py-1.5 text-xs
                           border-light-border dark:border-dark-border
                           bg-light-bg dark:bg-dark-bg
                           text-light-body-text dark:text-dark-body-text
                           focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent
                           outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>

            <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || !!isError}
                placeholder="Repeat password"
                className="mt-1 w-full border rounded-lg px-2.5 py-1.5 text-xs
                           border-light-border dark:border-dark-border
                           bg-light-bg dark:bg-dark-bg
                           text-light-body-text dark:text-dark-body-text
                           focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent
                           outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>

            {message && (
              <p className={`text-xs ${isError ? "text-red-500 dark:text-red-400" : "text-light-accent dark:text-dark-accent"}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !!isError}
              className="mt-1 px-4 py-2 rounded-lg font-medium text-xs
                         bg-light-btn-bg text-light-btn-text
                         hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                         dark:bg-dark-btn-bg dark:text-dark-btn-text
                         dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="sr-only">Reset Password | WatchedThis</h1>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
