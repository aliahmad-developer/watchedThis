"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

type Props = {
  newUsername: string;
  setNewUsername: (value: string) => void;
  handleUsernameUpdate: () => Promise<void>;
  isUpdatingUsername: boolean;
  user: any;
};

export default function UsernameUpdate({
  newUsername,
  setNewUsername,
  handleUsernameUpdate,
  isUpdatingUsername,
  user,
}: Props) {
  // Always compare against live user prop (updated from parent useAuth)
  const savedUsername = user?.displayName || "";
  const isUnchanged =
    newUsername === savedUsername || newUsername.trim() === "";

  const handleSave = async () => {
    try {
      await handleUsernameUpdate();
      toast.success("Username updated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update username.");
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
        Username
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          maxLength={20}
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="w-full border rounded-lg px-2.5 py-1.5 text-xs
            border-light-border dark:border-dark-border
            bg-light-bg dark:bg-dark-bg
            text-light-body-text dark:text-dark-body-text
            focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
        />
        <button
          onClick={handleSave}
          disabled={isUpdatingUsername || isUnchanged}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${
              isUpdatingUsername || isUnchanged
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
  );
}
