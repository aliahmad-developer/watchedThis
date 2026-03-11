"use client";
import { useState } from "react";
import { login, signInWithGoogle, signInWithApple} from "./auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";

type LoginFormProps = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onForgotPassword?: () => void;
  onSwitchToSignup?: () => void;
};

export default function LoginForm({
  onSuccess,
  onError,
  onForgotPassword,
  onSwitchToSignup,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [noAccount, setNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const anyLoading = loading || oauthLoading !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setNoAccount(false);

    try {
      const result = await login(email, password);
      if (result.success) {
        setMessage(result.message);
        if (onSuccess) onSuccess();
      } else {
        setMessage(result.message);
        if (result.noAccount) setNoAccount(true);
        if (onError) onError(result.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please try again.";
      setMessage(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    setMessage("");
    setNoAccount(false);
    try {
      // signInWithPopup handles both new and existing accounts automatically
      const result =
        provider === "google" ? await signInWithGoogle() : await signInWithApple();
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        const msg = result.message ?? "OAuth sign-in failed.";
        setMessage(msg);
        if (onError) onError(msg);
      }
    } catch (error: any) {
      const msg = error.message || "OAuth sign-in failed.";
      setMessage(msg);
      if (onError) onError(msg);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm w-full bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border"
    >
      <h2 className="text-lg font-semibold">
        Login
      </h2>

      {/* OAuth Buttons */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={anyLoading}
          className="flex items-center justify-center gap-2 w-full h-9 px-4 rounded-lg border
                     border-light-border dark:border-dark-border
                     bg-light-bg dark:bg-dark-bg
                     text-light-body-text dark:text-dark-body-text
                     hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                     dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-xs font-medium transition-colors"
        >
          {oauthLoading === "google" ? (
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <FontAwesomeIcon icon={faGoogle} className="w-3 h-3" />
          )}
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth("apple")}
          disabled={anyLoading}
          className="flex items-center justify-center gap-2 w-full h-9 px-4 rounded-lg border
                     border-light-border dark:border-dark-border
                     bg-light-bg dark:bg-dark-bg
                     text-light-body-text dark:text-dark-body-text
                     hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                     dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-xs font-medium transition-colors"
        >
          {oauthLoading === "apple" ? (
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <FontAwesomeIcon icon={faApple} className="w-3.5 h-3.5" />
          )}
          Continue with Apple
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-light-border dark:bg-dark-border" />
        <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">or</span>
        <div className="flex-1 h-px bg-light-border dark:bg-dark-border" />
      </div>

      {/* Email */}
      <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
        Email
        <input
          type="email"
          id="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setNoAccount(false);
            setMessage("");
          }}
          required
          disabled={anyLoading}
          autoComplete="email"
          className={`mt-1 w-full border rounded-lg p-2 text-sm
                     ${noAccount ? "border-red-500" : "border-light-border dark:border-dark-border"}
                     bg-light-bg dark:bg-dark-bg
                     text-light-body-text dark:text-dark-body-text
                     focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
        />
      </label>

      {/* Password */}
      <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text relative">
        <div className="flex justify-between items-center mb-1">
          <span>Password</span>
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={anyLoading}
              className="text-light-accent dark:text-dark-accent hover:underline text-xs font-normal bg-transparent disabled:opacity-50"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={anyLoading}
            autoComplete="current-password"
            className="w-full border rounded-lg p-2 pr-10 text-sm
                       border-light-border dark:border-dark-border
                       bg-light-bg dark:bg-dark-bg
                       text-light-body-text dark:text-dark-body-text
                       focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="bg-transparent absolute inset-y-0 right-2 flex items-center text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
            disabled={anyLoading}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-3 h-3" />
          </button>
        </div>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={anyLoading}
        className="px-4 py-2 rounded-lg font-medium text-sm h-9 flex items-center justify-center
                   bg-light-btn-bg text-light-btn-text 
                   hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                   dark:bg-dark-btn-bg dark:text-dark-btn-text
                   dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                   disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Checking...
          </>
        ) : (
          "Login"
        )}
      </button>

      {/* Message — with signup nudge if no account found */}
      {message && (
        <div
          className={`p-2 rounded-md text-xs ${
            message.toLowerCase().includes("success")
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {message}
          {noAccount && onSwitchToSignup && (
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="block mt-1 underline font-medium bg-transparent text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
            >
              Create an account →
            </button>
          )}
        </div>
      )}
    </form>
  );
}