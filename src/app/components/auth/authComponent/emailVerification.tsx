"use client";
import { User } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faEnvelope } from "@fortawesome/free-solid-svg-icons";

type Props = {
  user: User;
  isVerified: boolean;
  handleSendVerification: () => void;
  isSendingVerification: boolean;
};

export default function EmailVerification({
  user,
  isVerified,
  handleSendVerification,
  isSendingVerification,
}: Props) {
  return (
    <div
      className={`flex flex-col ${
        isVerified
          ? "items-start" // keeps the pill compact
          : "p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {isVerified ? (
            <span className="cursorflex items-center gap-2 px-3 py-1 rounded-full border-1 border-light-accent text-light-accent dark:text-dark-accent dark:border-dark-accent  text-sm font-medium flex-row">
              <FontAwesomeIcon icon={faCheckCircle} />
              Verified
            </span>
          ) : (
            <>
              <FontAwesomeIcon
                icon={faEnvelope}
                className="mt-1 mr-2 text-light-accent dark:text-dark-accent"
              />
              <span className="text-sm text-light-body-text dark:text-dark-body-text">
                Email Not Verified
              </span>
            </>
          )}
        </div>
        {!isVerified && (
          <button
            onClick={handleSendVerification}
            disabled={isSendingVerification}
            className={`px-3 py-1 rounded text-sm ${
              isSendingVerification
                ? "bg-light-disabled dark:bg-dark-disabled cursor-not-allowed"
                : "bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg"
            } transition-colors`}
          >
            {isSendingVerification ? "Sending..." : "Verify Email"}
          </button>
        )}
      </div>
      {!isVerified && (
        <p className="text-xs mt-2 text-light-secondary-text dark:text-dark-secondary-text">
          Check your inbox for the verification email. It may be in spam.
        </p>
      )}
    </div>
  );
}
