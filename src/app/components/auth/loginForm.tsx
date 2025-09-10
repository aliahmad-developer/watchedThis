"use client";
import { useState } from "react";
import { login } from "./auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

type LoginFormProps = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export default function LoginForm({ onSuccess, onError }: LoginFormProps) {
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
      const result = await login(email, password);
      if (result.success) {
        setMessage(result.message);
        if (onSuccess) onSuccess();
      } else {
        setMessage(result.message);
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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm w-full bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md"
    >
      <h2 className="text-lg font-semibold text-light-header dark:text-dark-header">
        Login
      </h2>

      {/* Email */}
      <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
        Email
        <input
          type="email"
          placeholder="Email"
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
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
            disabled={loading}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-3 h-3" />
          </button>
        </div>
      </label>

      {/* Submit */}
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
        {loading ? "Checking..." : "Login"}
      </button>

      {/* Message */}
      {message && (
        <p className={`text-xs ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </form>
  );
}