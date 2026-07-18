"use client";
import { useState, useRef, useEffect } from "react";
import { signup, signInWithGoogle, signInWithApple } from "./auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import type { User } from "@supabase/supabase-js";
import VerifyEmailModal from "./verifyEmailModal";
import { useId } from "react";

type SignupFormProps = {
  onSuccess?: (newUser: User, username: string) => void;
  onError?: (error: string) => void;
  onSwitchToLogin?: () => void;
};

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUsername = (username: string) =>
  /^[a-zA-Z0-9_-]{3,20}$/.test(username);
const sanitizeInput = (input: string) => input.replace(/[<>]/g, "").trim();

const validatePassword = (password: string) => ({
  minLength: password.length >= 8,
  hasUpperCase: /[A-Z]/.test(password),
  hasLowerCase: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
});
const Spinner = () => (
  <svg
    className="animate-spin h-3 w-3"
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
);

export default function SignupForm({
  onSuccess,
  onError,
  onSwitchToLogin,
}: SignupFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );
  const [unverifiedResent, setUnverifiedResent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [shakeTerms, setShakeTerms] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const termsRef = useRef<HTMLDivElement>(null);

  const reqs = validatePassword(password);
  const allReqsMet = Object.values(reqs).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const anyLoading = loading || oauthLoading !== null;

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const usernameId = useId();
  const termsId = useId();

  const triggerTermsError = () => {
    setValidationErrors((prev) => ({
      ...prev,
      terms: "You must accept the terms of service",
    }));
    setShakeTerms(true);
    setTimeout(() => setShakeTerms(false), 600);
    termsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!username) errors.username = "Required";
    else if (!validateUsername(username))
      errors.username = "3–20 chars, letters/numbers/_/-";
    if (!email) errors.email = "Required";
    else if (!validateEmail(email)) errors.email = "Invalid email";
    if (!password) errors.password = "Required";
    else if (!allReqsMet)
      errors.password = "Password does not meet requirements";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (!acceptedTerms) errors.terms = "You must accept the terms of service";
    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    if (!isValid && errors.terms) triggerTermsError();
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setAccountExists(false);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await signup(
        sanitizeInput(email),
        password,
        sanitizeInput(username),
      );

      if (result.success || result.unverifiedResent) {
        if (result.unverifiedResent) setUnverifiedResent(true);
        setShowVerifyModal(true);
      } else {
        setMessage(result.message);
        if (result.accountExists) setAccountExists(true);
        if (onError) onError(result.message);
      }
    } catch (error: any) {
      const msg = error.message || "Sign up failed. Please try again.";
      setMessage(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (!acceptedTerms) {
      triggerTermsError();
      return;
    }
    setOauthLoading(provider);
    setMessage("");
    setAccountExists(false);
    try {
      const result =
        provider === "google"
          ? await signInWithGoogle()
          : await signInWithApple();

      // Supabase OAuth uses a full-page redirect.
      // If successful, the browser navigates away, so we return early.
      if (result.redirect) return;

      // If redirect is false, it means an error occurred.
      const msg = result.message ?? "OAuth sign-in failed.";
      setMessage(msg);
      if (onError) onError(msg);
    } catch (error: any) {
      const msg = error.message || "OAuth sign-in failed.";
      setMessage(msg);
      if (onError) onError(msg);
    } finally {
      setOauthLoading(null);
    }
  };
  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-5px)}
          30%{transform:translateX(5px)}
          45%{transform:translateX(-3px)}
          60%{transform:translateX(3px)}
          75%{transform:translateX(-2px)}
          90%{transform:translateX(2px)}
        }
        .shake{animation:shake 0.6s ease}
      `}</style>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2.5 w-full bg-light-card dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border"
      >
        <h2 className="text-base">Create Account</h2>

        {/* OAuth Buttons */}
        <div className="flex gap-2">
          {(["google", "apple"] as const).map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleOAuth(provider)}
              disabled={anyLoading}
              className="flex items-center justify-center gap-1.5 flex-1 h-8 px-2 rounded-md border
                         border-light-border dark:border-dark-border
                         bg-light-bg dark:bg-dark-bg
                         text-light-body-text dark:text-dark-body-text
                         hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                         dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-xs font-medium transition-colors"
            >
              {oauthLoading === provider ? (
                <Spinner />
              ) : (
                <FontAwesomeIcon
                  icon={provider === "google" ? faGoogle : faApple}
                  size="sm"
                />
              )}
              <span className="m-0">
                {provider === "google" ? "Google" : "Apple"}
              </span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-light-border dark:bg-dark-border" />
          <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
            or
          </span>
          <div className="flex-1 h-px bg-light-border dark:bg-dark-border" />
        </div>

        {/* Username + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor={usernameId}
              className="text-xs font-medium text-light-body-text dark:text-dark-body-text"
            >
              Username
            </label>
            <input
              id={usernameId}
              type="text"
              placeholder="Choose username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (validationErrors.username)
                  setValidationErrors({ ...validationErrors, username: "" });
              }}
              required
              disabled={anyLoading}
              autoComplete="username"
              className={`mt-1 w-full border rounded-md p-2 text-xs h-8
                         ${validationErrors.username ? "border-red-500" : "border-light-border dark:border-dark-border"}
                         bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text
                         focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
            />
            {validationErrors.username && (
              <p className="text-red-500 text-xs mt-0.5">
                {validationErrors.username}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={emailId}
              className="text-xs font-medium text-light-body-text dark:text-dark-body-text"
            >
              Email
            </label>
            <input
              id={emailId}
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAccountExists(false);
                setMessage("");
                if (validationErrors.email)
                  setValidationErrors({ ...validationErrors, email: "" });
              }}
              required
              disabled={anyLoading}
              autoComplete="email"
              className={`mt-1 w-full border rounded-md p-2 text-xs h-8
                         ${validationErrors.email || accountExists ? "border-red-500" : "border-light-border dark:border-dark-border"}
                         bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text
                         focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
            />
            {validationErrors.email && (
              <p className="text-red-500 text-xs mt-0.5">
                {validationErrors.email}
              </p>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor={passwordId}
            className="text-xs font-medium text-light-body-text dark:text-dark-body-text"
          >
            Password
          </label>
          <div className="relative mt-1">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password)
                  setValidationErrors({ ...validationErrors, password: "" });
              }}
              required
              minLength={8}
              disabled={anyLoading}
              autoComplete="new-password"
              className={`w-full border rounded-md p-2 pr-8 text-xs h-8
                         ${validationErrors.password ? "border-red-500" : "border-light-border dark:border-dark-border"}
                         bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text
                         focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              disabled={anyLoading}
              className="bg-transparent absolute inset-y-0 right-2 flex items-center text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
            >
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                size="2xs"
              />
            </button>
          </div>

          {password.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {[
                { key: "minLength" as const, label: "8+ chars" },
                { key: "hasUpperCase" as const, label: "Uppercase" },
                { key: "hasLowerCase" as const, label: "Lowercase" },
                { key: "hasNumber" as const, label: "Number" },
              ].map(({ key, label }) => (
                <span
                  key={key}
                  className={`flex items-center gap-1 text-xs ${
                    reqs[key]
                      ? "text-accent dark:text-dark-accent"
                      : "text-light-secondary-text dark:text-dark-secondary-text"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={reqs[key] ? faCheckCircle : faTimesCircle}
                    className={`w-2.5 h-2.5 ${reqs[key] ? "text-accent dark:text-dark-accent" : "text-light-secondary-text dark:text-dark-secondary-text"}`}
                  />
                  {label}
                </span>
              ))}
            </div>
          )}
          {validationErrors.password && (
            <p className="text-red-500 text-xs mt-0.5">
              {validationErrors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor={confirmPasswordId}
            className="text-xs font-medium text-light-body-text dark:text-dark-body-text"
          >
            Confirm Password
          </label>
          <div className="relative mt-1">
            <input
              id={confirmPasswordId}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (validationErrors.confirmPassword)
                  setValidationErrors({
                    ...validationErrors,
                    confirmPassword: "",
                  });
              }}
              required
              disabled={anyLoading}
              autoComplete="new-password"
              className={`w-full border rounded-md p-2 pr-8 text-xs h-8
                         ${validationErrors.confirmPassword || (confirmPassword && !passwordsMatch) ? "border-red-500" : "border-light-border dark:border-dark-border"}
                         bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text
                         focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              disabled={anyLoading}
              className="bg-transparent absolute inset-y-0 right-2 flex items-center text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
            >
              <FontAwesomeIcon
                icon={showConfirmPassword ? faEyeSlash : faEye}
                size="2xs"
              />
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-red-500 text-xs mt-0.5">
              Passwords do not match
            </p>
          )}
        </div>

        {/* Terms */}
        <div
          ref={termsRef}
          className={`flex items-start ${shakeTerms ? "shake" : ""}`}
        >
          <input
            id={termsId}
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              if (validationErrors.terms)
                setValidationErrors({ ...validationErrors, terms: "" });
            }}
            className="
            mt-0.5 w-3 h-3
            appearance-none
            border border-light-border dark:border-dark-border
            bg-light-bg dark:bg-dark-bg
            rounded
            checked:bg-light-accent dark:checked:bg-dark-accent
            checked:border-light-accent dark:checked:border-dark-accent
            relative
            checked:after:content-['✔']
            checked:after:absolute
            checked:after:text-white
            checked:after:text-[10px]
            checked:after:left-0.5
            checked:after:-top-px
            cursor-pointer
            transition-all duration-150 ease-out
            hover:brightness-110 hover:border-light-accent hover:dark:border-dark-accent
          "
          />
          <label
            htmlFor={termsId}
            className="cursor-pointer ml-2 text-xs text-light-secondary-text dark:text-dark-secondary-text leading-tight"
          >
            I agree to the{" "}
            <a
              href="/terms"
              className="text-light-accent dark:text-dark-accent hover:underline"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-light-accent dark:text-dark-accent hover:underline"
            >
              Privacy Policy.
            </a>
          </label>
        </div>
        {validationErrors.terms && (
          <p className="text-red-500 text-xs -mt-1.5">
            {validationErrors.terms}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={anyLoading}
          className="flex items-center justify-center gap-2 w-full h-8 rounded-md font-medium text-xs mt-1
                     bg-light-btn-bg text-light-btn-text
                     hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                     dark:bg-dark-btn-bg dark:text-dark-btn-text
                     dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Spinner /> Sending...
            </>
          ) : (
            "Continue"
          )}
        </button>

        {/* Error Message */}
        {message && (
          <div
            className={`p-2 rounded-md text-xs ${
              message.toLowerCase().includes("success")
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {message}
            {accountExists && onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="inline underline mt-1 font-medium bg-transparent text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors hover:underline"
              >
                Go to login
              </button>
            )}
          </div>
        )}
      </form>

      {/* Verify Email Modal */}
      {showVerifyModal && (
        <VerifyEmailModal
          email={sanitizeInput(email)}
          password={password}
          username={sanitizeInput(username)}
          onClose={() => {
            setShowVerifyModal(false);
            setUnverifiedResent(false);
          }}
          onSwitchToLogin={onSwitchToLogin}
        />
      )}
    </>
  );
}
