"use client";
import { useState } from "react";
import { User, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faEye, faEyeSlash, faCircleNotch, faCheckCircle, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

type PasswordUpdateArgs = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  resetFields: () => void;
};

type Props = {
  user: User;
  handlePasswordUpdate: (args: PasswordUpdateArgs) => Promise<void>;
};

export default function PasswordUpdate({ user, handlePasswordUpdate }: Props) {
  const [passwordDropdownOpen, setPasswordDropdownOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePasswordUpdateWrapper = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    
    try {
      await handlePasswordUpdate({
        oldPassword,
        newPassword,
        confirmPassword,
        resetFields: () => {
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setPasswordDropdownOpen(false);
        },
      });
      
      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
        setIsSaving(false);
      }, 2000);
    } catch (error: any) {
      setSaveStatus("error");
      setErrorMessage(error.message || "Failed to update password");
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="flex flex-col items-start mt-2">
      <button
        type="button"
        onClick={() => setPasswordDropdownOpen((prev) => !prev)}
        className="py-2 px-4 bg-transparent text-light-body-text dark:text-dark-body-text hover:text-light-accent dark:hover:text-dark-secondary-text text-sm transition-colors"
        aria-expanded={passwordDropdownOpen}
        aria-controls="password-dropdown"
      >
        <FontAwesomeIcon icon={faKey} className="w-4 h-4 mr-2" />
        Change Password
      </button>

      {passwordDropdownOpen && (
        <div className="mt-2 w-full flex flex-col gap-2" id="password-dropdown">
          {/* Old Password */}
          <InputWithToggle
            placeholder="Old password"
            value={oldPassword}
            setValue={setOldPassword}
            show={showOldPassword}
            setShow={setShowOldPassword}
          />

          {/* New Password */}
          <InputWithToggle
            placeholder="New password"
            value={newPassword}
            setValue={setNewPassword}
            show={showNewPassword}
            setShow={setShowNewPassword}
            minLength={6}
          />

          {/* Confirm Password */}
          <InputWithToggle
            placeholder="Confirm new password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            show={showConfirmPassword}
            setShow={setShowConfirmPassword}
            minLength={6}
          />

          {/* Status Message */}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 p-2 rounded-md bg-red-50 dark:bg-red-900/20">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handlePasswordUpdateWrapper}
            disabled={isSaving}
            className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              isSaving
                ? "bg-light-disabled dark:bg-dark-disabled cursor-progress"
                : "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
            }`}
          >
            {isSaving ? (
              <>
                <FontAwesomeIcon icon={faCircleNotch} className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveStatus === "success" ? (
              <>
                <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
                <span>Password Updated!</span>
              </>
            ) : (
              <span>Save Password</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Reusable Input with Show/Hide toggle
function InputWithToggle({
  placeholder,
  value,
  setValue,
  show,
  setShow,
  minLength,
}: {
  placeholder: string;
  value: string;
  setValue: (val: string) => void;
  show: boolean;
  setShow: (val: boolean) => void;
  minLength?: number;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        minLength={minLength}
        className="mt-1 w-full border rounded-lg p-2 text-sm
                   border-light-border dark:border-dark-border
                   bg-light-bg dark:bg-dark-bg
                   text-light-body-text dark:text-dark-body-text
                   focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-2 text-gray-400 dark:text-gray-300 bg-transparent"
      >
        <FontAwesomeIcon icon={show ? faEye : faEyeSlash} className="w-3 h-3" />
      </button>
    </div>
  );
}