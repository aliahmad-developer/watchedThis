"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faLock,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

const rules: { key: string; label: string; test: (p: string) => boolean }[] = [
  {
    key: "minLength",
    label: "At least 8 characters",
    test: (p) => p.length >= 8,
  },
  { key: "hasNumber", label: "One number", test: (p) => /\d/.test(p) },
  {
    key: "hasSpecial",
    label: "One special character",
    test: (p) => /[^a-zA-Z0-9]/.test(p),
  },
];

function EyeToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className=" bg-transparent absolute right-3 top-1/2 -translate-y-1/2 text-light-secondary-text dark:text-dark-secondary-text hover:text-light-header dark:hover:text-dark-header transition-colors"
    >
      <FontAwesomeIcon
        icon={show ? faEye : faEyeSlash}
        size="2xs"
      />
    </button>
  );
}

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center w-full px-4 pt-4 pb-6 sm:pt-8 sm:min-h-[calc(100vh-160px)]">
    {children}
  </div>
);

function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [success, setSuccess] = useState(false);

  const allRulesMet = rules.every((r) => r.test(password));
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const canSubmit =
    allRulesMet &&
    passwordsMatch &&
    !loading &&
    password.length > 0 &&
    confirm.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/confirmReset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        return;
      }
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => router.push("/user/profile"), 3000);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageWrapper>
        <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-light-accent/10 dark:bg-dark-accent/10">
            <FontAwesomeIcon
              icon={faLock}
              className="h-5 w-auto text-light-accent dark:text-dark-accent"
            />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-light-header dark:text-dark-header">
            Password Updated
          </h2>
          <p className="mt-2 text-sm text-light-secondary-text dark:text-dark-secondary-text">
            Redirecting you now...
          </p>
          <div className="mt-5 w-full h-1 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
            <div className="h-full rounded-full bg-light-accent dark:bg-dark-accent animate-progress" />
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header — icon and text as one left-aligned block */}
        <div className="mb-4 sm:mb-5 flex items-center gap-3">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-light-accent/10 dark:bg-dark-accent/10">
            <FontAwesomeIcon
              icon={faLock}
              className="h-4 w-auto text-light-accent dark:text-dark-accent"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold leading-tight text-light-header dark:text-dark-header">
              Choose a new password
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text">
              Must meet all requirements below.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3.5 sm:p-5 w-full">
          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs sm:text-sm mb-2 text-light-secondary-text dark:text-dark-secondary-text">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setTouched(true);
                  }}
                  placeholder="Enter new password"
                  className="w-full border rounded-xl px-3 py-3 pr-10 text-sm
                             border-light-border dark:border-dark-border
                             bg-light-bg dark:bg-dark-bg
                             text-light-body-text dark:text-dark-body-text
                             placeholder:text-light-secondary-text/40 dark:placeholder:text-dark-secondary-text/40
                             focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent
                             focus:border-transparent outline-none transition-all"
                />
                <EyeToggle
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </div>
              {touched && password.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {rules.map((rule) => {
                    const passed = rule.test(password);
                    if (passed) return null;

                    return (
                      <span
                        key={rule.key}
                        className="flex items-center gap-1 text-[11px] text-red-500"
                      >
                        <FontAwesomeIcon
                          icon={faTimesCircle}
                          className="w-2.5 h-2.5"
                        />
                        {rule.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-px bg-light-border dark:bg-dark-border" />

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm mb-2 text-light-secondary-text dark:text-dark-secondary-text">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  className={`w-full border rounded-xl px-3 py-3 pr-10 text-sm
                             bg-light-bg dark:bg-dark-bg
                             text-light-body-text dark:text-dark-body-text
                             placeholder:text-light-secondary-text/40 dark:placeholder:text-dark-secondary-text/40
                             focus:ring-2 focus:border-transparent outline-none transition-all
                             ${
                               confirm && !passwordsMatch
                                 ? "border-red-400 focus:ring-red-400/30"
                                 : "border-light-border dark:border-dark-border focus:ring-light-accent dark:focus:ring-dark-accent"
                             }`}
                />
                <EyeToggle
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
              </div>
              {confirm && !passwordsMatch && (
                <p className="mt-2 text-[11px] text-red-500">
                  Passwords do not match.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full px-4 py-3 rounded-xl font-medium text-sm
             bg-light-btn-bg text-light-btn-text
             hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
             dark:bg-dark-btn-bg dark:text-dark-btn-text
             dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
             disabled:opacity-40 disabled:cursor-not-allowed
             transition-all active:scale-[0.98]
             flex items-center justify-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin h-3 w-3 shrink-0"
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
              )}

              <span>{loading ? "Updating..." : "Set New Password"}</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        .animate-progress { animation: progress 3s linear forwards; }
      `}</style>
    </PageWrapper>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
