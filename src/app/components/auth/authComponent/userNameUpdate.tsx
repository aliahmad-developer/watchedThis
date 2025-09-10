"use client";
import { User } from "firebase/auth";

type Props = {
  user: User;
  newUsername: string;
  setNewUsername: (value: string) => void;
  handleUsernameUpdate: () => void;
  isUpdatingUsername: boolean;
};

export default function UsernameUpdate({
  user,
  newUsername,
  setNewUsername,
  handleUsernameUpdate,
  isUpdatingUsername,
}: Props) {
  const isUsernameUnchanged = newUsername === (user?.displayName || "");

  return (
    <div className="flex flex-col">
      <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
        Username
      </label>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={20}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="mt-1 w-full border rounded-lg p-2 text-sm
             border-light-border dark:border-dark-border
             bg-light-bg dark:bg-dark-bg
             text-light-body-text dark:text-dark-body-text
             focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
          />
          <button
            onClick={handleUsernameUpdate}
            disabled={isUpdatingUsername || isUsernameUnchanged}
            className={`px-3 py-2 rounded-lg transition-colors ${
              isUpdatingUsername || isUsernameUnchanged
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
            }`}
          >
            {isUpdatingUsername ? "Saving..." : "Save"}
          </button>
        </div>
        {newUsername.length >= 20 && (
          <p className="text-xs text-red-500">
            Maximum character limit reached (20).
          </p>
        )}
      </div>
    </div>
  );
}
