"use client";
import { useState } from "react";
import { signup } from "./auth";
import type { User } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

type SignupFormProps = {
  onSuccess?: (newUser: User, username: string) => void;
  onError?: (error: string) => void;
};

export default function SignupForm({ onSuccess, onError }: SignupFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await signup(email, password, username);
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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm w-full bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md"
    >
      <h2 className="text-lg font-semibold text-light-header dark:text-dark-header">
        Sign Up
      </h2>

      {/* Username */}
      <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
        Username
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          autoComplete="username"
          className="mt-1 w-full border rounded-lg p-2 text-sm
                     border-light-border dark:border-dark-border
                     bg-light-bg dark:bg-dark-bg
                     text-light-body-text dark:text-dark-body-text
                     focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
        />
      </label>

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
                     focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
        />
      </label>

      {/* Password */}
      <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text relative">
        Password
        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
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
            disabled={loading}
          >
            <FontAwesomeIcon
              icon={showPassword ? faEyeSlash : faEye}
              className="w-3 h-3"
            />
          </button>
        </div>
      </label>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg font-medium text-sm
                   bg-light-btn-bg text-light-btn-text 
                   hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
                   dark:bg-dark-btn-bg dark:text-dark-btn-text
                   dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
                   disabled:opacity-50 transition-colors"
      >
        {loading ? "Processing..." : "Sign Up"}
      </button>

      {/* Message */}
      {message && (
        <p
          className={`text-xs ${
            message.toLowerCase().includes("success")
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}