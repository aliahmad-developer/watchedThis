"use client";
import { useState } from "react";
import { signup } from "./auth";
import type { User } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faCheckCircle,
  faTimesCircle,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

type SignupFormProps = {
  onSuccess?: (newUser: User, username: string) => void;
  onError?: (error: string) => void;
};

// Input validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

const validatePassword = (
  password: string
): { valid: boolean; requirements: Record<string, boolean> } => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const valid = Object.values(requirements).every(Boolean);
  return { valid, requirements };
};

const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, "").trim();
};

export default function SignupForm({ onSuccess, onError }: SignupFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!username) {
      errors.username = "Username is required";
    } else if (!validateUsername(username)) {
      errors.username =
        "Username must be 3-20 characters and can only contain letters, numbers, underscores, or hyphens";
    }

    if (!email) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errors.password = "Password does not meet requirements";
      }
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!acceptedTerms) {
      errors.terms = "You must accept the terms of service";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedEmail = sanitizeInput(email);

      const result = await signup(sanitizedEmail, password, sanitizedUsername);
      if (result.success && result.user && onSuccess) {
        setMessage(result.message);
        onSuccess(result.user, result.username);
      } else {
        setMessage(result.message);
        if (onError) onError(result.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Sign up failed. Please try again.";
      setMessage(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 max-w-md w-full bg-light-card dark:bg-dark-card p-5 rounded-xl shadow-md border border-light-border dark:border-dark-border"
    >
      <h2 className="text-lg font-bold text-light-header dark:text-dark-header mb-1">
        Create Account
      </h2>

      {/* Username */}
      <div>
        <label className="text-xs font-medium text-light-body-text dark:text-dark-body-text">
          Username
        </label>
        <input
          type="text"
          placeholder="Choose username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (validationErrors.username)
              setValidationErrors({ ...validationErrors, username: "" });
          }}
          required
          disabled={loading}
          autoComplete="username"
          className={`mt-1 w-full border rounded-md p-2 text-xs h-9
                     ${
                       validationErrors.username
                         ? "border-red-500"
                         : "border-light-border dark:border-dark-border"
                     }
                     bg-light-bg dark:bg-dark-bg
                     text-light-body-text dark:text-dark-body-text
                     focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
        />
        {validationErrors.username && (
          <p className="text-red-500 text-xs mt-1">
            {validationErrors.username}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="text-xs font-medium text-light-body-text dark:text-dark-body-text">
          Email
        </label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (validationErrors.email)
              setValidationErrors({ ...validationErrors, email: "" });
          }}
          required
          disabled={loading}
          autoComplete="email"
          className={`mt-1 w-full border rounded-md p-2 text-xs h-9
                     ${
                       validationErrors.email
                         ? "border-red-500"
                         : "border-light-border dark:border-dark-border"
                     }
                     bg-light-bg dark:bg-dark-bg
                     text-light-body-text dark:text-dark-body-text
                     focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
        />
      </div>

      {/* Password */}
      <div>
        <label className="text-xs font-medium text-light-body-text dark:text-dark-body-text">
          Password
        </label>
        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password)
                setValidationErrors({ ...validationErrors, password: "" });
              if (e.target.value.length > 0) setShowPasswordRequirements(true);
            }}
            onFocus={() =>
              password.length > 0 && setShowPasswordRequirements(true)
            }
            required
            minLength={8}
            disabled={loading}
            autoComplete="new-password"
            className={`w-full border rounded-md p-2 pr-8 text-xs h-9
                       ${
                         validationErrors.password
                           ? "border-red-500"
                           : "border-light-border dark:border-dark-border"
                       }
                       bg-light-bg dark:bg-dark-bg
                       text-light-body-text dark:text-dark-body-text
                       focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="bg-transparent absolute inset-y-0 right-2 flex items-center text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            disabled={loading}
          >
            <FontAwesomeIcon
              icon={showPassword ? faEyeSlash : faEye}
              className="w-3 h-3"
            />
          </button>
        </div>

        {/* Password requirements - Collapsible */}
        {password && showPasswordRequirements && (
          <div className="mt-2 text-xs bg-light-bg dark:bg-dark-bg p-2 rounded-md border border-light-border dark:border-dark-border">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() =>
                setShowPasswordRequirements(!showPasswordRequirements)
              }
            >
              <p className="font-medium text-light-body-text dark:text-dark-body-text">
                Password requirements:
              </p>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-3 h-3 text-light-secondary-text dark:text-dark-secondary-text transition-transform ${
                  showPasswordRequirements ? "rotate-180" : ""
                }`}
              />
            </div>

            {showPasswordRequirements && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={
                      passwordValidation.requirements.minLength
                        ? faCheckCircle
                        : faTimesCircle
                    }
                    className={`w-3 h-3 mr-1 ${
                      passwordValidation.requirements.minLength
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  />
                  <span
                    className={
                      passwordValidation.requirements.minLength
                        ? "text-green-600 dark:text-green-400"
                        : "text-light-secondary-text dark:text-dark-secondary-text"
                    }
                  >
                    8+ characters
                  </span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={
                      passwordValidation.requirements.hasUpperCase
                        ? faCheckCircle
                        : faTimesCircle
                    }
                    className={`w-3 h-3 mr-1 ${
                      passwordValidation.requirements.hasUpperCase
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  />
                  <span
                    className={
                      passwordValidation.requirements.hasUpperCase
                        ? "text-green-600 dark:text-green-400"
                        : "text-light-secondary-text dark:text-dark-secondary-text"
                    }
                  >
                    Uppercase letter
                  </span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={
                      passwordValidation.requirements.hasLowerCase
                        ? faCheckCircle
                        : faTimesCircle
                    }
                    className={`w-3 h-3 mr-1 ${
                      passwordValidation.requirements.hasLowerCase
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  />
                  <span
                    className={
                      passwordValidation.requirements.hasLowerCase
                        ? "text-green-600 dark:text-green-400"
                        : "text-light-secondary-text dark:text-dark-secondary-text"
                    }
                  >
                    Lowercase letter
                  </span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={
                      passwordValidation.requirements.hasNumber
                        ? faCheckCircle
                        : faTimesCircle
                    }
                    className={`w-3 h-3 mr-1 ${
                      passwordValidation.requirements.hasNumber
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  />
                  <span
                    className={
                      passwordValidation.requirements.hasNumber
                        ? "text-green-600 dark:text-green-400"
                        : "text-light-secondary-text dark:text-dark-secondary-text"
                    }
                  >
                    Number
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {validationErrors.password && (
          <p className="text-red-500 text-xs mt-1">
            {validationErrors.password}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="text-xs font-medium text-light-body-text dark:text-dark-body-text">
          Confirm Password
        </label>
        <div className="relative mt-1">
          <input
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
            disabled={loading}
            autoComplete="new-password"
            className={`w-full border rounded-md p-2 pr-8 text-xs h-9
                       ${
                         validationErrors.confirmPassword
                           ? "border-red-500"
                           : "border-light-border dark:border-dark-border"
                       }
                       bg-light-bg dark:bg-dark-bg
                       text-light-body-text dark:text-dark-body-text
                       focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="bg-transparent absolute inset-y-0 right-2 flex items-center text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            disabled={loading}
          >
            <FontAwesomeIcon
              icon={showConfirmPassword ? faEyeSlash : faEye}
              className="w-3 h-3"
            />
          </button>
        </div>
        {confirmPassword && (
          <p
            className={`text-xs mt-1 ${
              passwordsMatch
                ? "text-green-600 dark:text-green-400"
                : "text-red-500"
            }`}
          >
            {!passwordsMatch && "Passwords do not match"}
          </p>
        )}
        {validationErrors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Terms of Service */}
      <div className="flex items-start mt-1">
        <div className="flex items-center h-4 mt-0.5">
          <input
            id="terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              if (validationErrors.terms)
                setValidationErrors({ ...validationErrors, terms: "" });
            }}
            className="w-3 h-3 text-light-accent dark:text-dark-accent bg-light-bg border-light-border rounded focus:ring-light-accent dark:focus:ring-dark-accent dark:ring-offset-dark-bg focus:ring-1 dark:bg-dark-bg dark:border-dark-border"
          />
        </div>
        <label
          htmlFor="terms"
          className="pt-0.5 ml-2 text-xs text-light-secondary-text dark:text-dark-secondary-text"
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
            Privacy Policy
          </a>
        </label>
      </div>
      {validationErrors.terms && (
        <p className="text-red-500 text-xs mt-1">{validationErrors.terms}</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-md font-medium text-xs mt-2 h-9
                   bg-light-btn-bg text-light-btn-text 
                   hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                   dark:bg-dark-btn-bg dark:text-dark-btn-text
                   dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                   disabled:opacity-50 disabled:cursor-not-allowed 
                   transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-3 w-3 text-light-btn-text dark:text-dark-btn-text"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Creating...
          </>
        ) : (
          "Create Account"
        )}
      </button>

      {/* Message */}
      {message && (
        <div
          className={`p-2 rounded-md text-xs ${
            message.toLowerCase().includes("success")
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
