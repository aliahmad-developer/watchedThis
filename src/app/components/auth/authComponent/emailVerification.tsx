"use client";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faEnvelope, faClock } from "@fortawesome/free-solid-svg-icons";

type Props = {
  user: User;
  isVerified: boolean;
  handleSendVerification: () => Promise<void>;
  isSendingVerification: boolean;
};

const COOLDOWN_SECONDS = 60;

export default function EmailVerification({
  user,
  isVerified,
  handleSendVerification,
  isSendingVerification,
}: Props) {
  const [cooldown, setCooldown] = useState(0);
  const [localError, setLocalError] = useState("");

  // Count down the cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleClick = async () => {
    if (cooldown > 0 || isSendingVerification) return;
    setLocalError("");
    try {
      await handleSendVerification();
    } catch (err: any) {
      if (err?.code === "auth/too-many-requests") {
        setLocalError("Too many attempts. Please wait before trying again.");
        setCooldown(COOLDOWN_SECONDS);
      } else {
        setLocalError(err?.message || "Failed to send verification email.");
      }
    }
  };

  const isDisabled = isSendingVerification || cooldown > 0;

  if (isVerified) {
    return (
      <div className="flex items-start">
        <span className="inline items-center gap-2 px-3 py-1 rounded-full border border-light-accent text-light-accent dark:text-dark-accent dark:border-dark-accent text-sm font-medium cursor-default">
          <FontAwesomeIcon icon={faCheckCircle} />
          Verified
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faEnvelope}
            className="mt-0.5 mr-2 text-light-accent dark:text-dark-accent"
          />
          <span className="text-sm text-light-body-text dark:text-dark-body-text">
            Email Not Verified
          </span>
        </div>

        <button
          onClick={handleClick}
          disabled={isDisabled}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm transition-colors
            ${
              isDisabled
                ? "opacity-50 cursor-not-allowed bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text"
                : "bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg"
            }`}
        >
          {cooldown > 0 ? (
            <>
              <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
              {cooldown}s
            </>
          ) : isSendingVerification ? (
            "Sending..."
          ) : (
            "Verify Email"
          )}
        </button>
      </div>

      {/* Info or error message */}
      {localError ? (
        <p className="text-xs mt-2 text-red-500 dark:text-red-400">{localError}</p>
      ) : (
        <p className="text-xs mt-2 text-light-secondary-text dark:text-dark-secondary-text">
          Check your inbox for the verification email. It may be in spam.
        </p>
      )}
    </div>
  );
}