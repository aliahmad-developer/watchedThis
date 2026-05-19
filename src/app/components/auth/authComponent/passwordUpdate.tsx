"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faEye,
  faEyeSlash,
  faCircleNotch,
  faTimes,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

type PasswordUpdateArgs = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  resetFields: () => void;
};

type Props = {
  handlePasswordUpdate: (args: PasswordUpdateArgs) => Promise<void>;
};

const rules = [
  {
    key: "minLength",
    label: "8+ chars",
    test: (p: string) => p.length >= 8,
  },
  {
    key: "hasUpper",
    label: "Uppercase",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    key: "hasLower",
    label: "Lowercase",
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    key: "hasNumber",
    label: "Number",
    test: (p: string) => /\d/.test(p),
  },
];

export default function PasswordUpdate({ handlePasswordUpdate }: Props) {
  const [open, setOpen] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // ✅ LOCK SCROLL + ESC CLOSE
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const allRulesMet = rules.every((r) => r.test(newPassword));
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const canSubmit =
    oldPassword.length > 0 && allRulesMet && passwordsMatch && !isSaving;

  const resetFields = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = async () => {
    if (!canSubmit) return;

    setIsSaving(true);

    try {
      await handlePasswordUpdate({
        oldPassword,
        newPassword,
        confirmPassword,
        resetFields: () => {
          resetFields();
          setOpen(false);
        },
      });

      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* TRIGGER */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className=" flex items-center gap-2 py-1.5 px-1 text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent transition-colors bg-transparent w-fit"
      >
        <FontAwesomeIcon icon={faKey} className="w-3 h-3" />
        Change Password
      </button>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4 py-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-90 sm:max-w-95 mx-auto bg-light-card dark:bg-dark-card 
           rounded-2xl shadow-2xl p-4 sm:p-5 relative animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              onClick={() => setOpen(false)}
              className="bg-transparent absolute top-3 right-3 text-gray-400 hover:text-accent-hover transition duration-100"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h2 className="text-sm sm:text-base font-semibold mb-4">
              Change Password
            </h2>

            {/* INPUTS */}
            <div className="space-y-3">
              <InputWithToggle
                placeholder="Old password"
                value={oldPassword}
                setValue={setOldPassword}
                show={showOld}
                setShow={setShowOld}
              />

              <InputWithToggle
                placeholder="New password"
                value={newPassword}
                setValue={setNewPassword}
                show={showNew}
                setShow={setShowNew}
              />

              {/* RULES */}
              {newPassword.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {rules.map((r) => {
                    const ok = r.test(newPassword);

                    return (
                      <span
                        key={r.key}
                        className={`flex items-center gap-1 text-[11px] ${
                          ok
                            ? "text-accent dark:text-dark-accent"
                            : "text-light-secondary-text dark:text-dark-secondary-text"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={ok ? faCheckCircle : faTimesCircle}
                          className="w-3 h-3"
                        />
                        {r.label}
                      </span>
                    );
                  })}
                </div>
              )}

              <InputWithToggle
                placeholder="Confirm password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                show={showConfirm}
                setShow={setShowConfirm}
              />

              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-red-500">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* BUTTON */}
            <button
              onClick={handleSave}
              disabled={!canSubmit}
              className="mt-4 w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2
                         bg-light-btn-bg text-light-btn-text
                         dark:bg-dark-btn-bg dark:text-dark-btn-text
                         hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all"
            >
              {isSaving ? (
                <>
                  <FontAwesomeIcon
                    icon={faCircleNotch}
                    className="w-3 h-3 animate-spin"
                  />
                  Saving...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ANIMATION */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </>
  );
}

/* INPUT */
function InputWithToggle({ placeholder, value, setValue, show, setShow }: any) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-lg px-2.5 py-2 text-xs pr-8
                   border-light-border dark:border-dark-border
                   bg-light-bg dark:bg-dark-bg
                   text-light-body-text dark:text-dark-body-text
                   focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="bg-transparent absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
      >
        <FontAwesomeIcon icon={show ? faEye : faEyeSlash} size="2xs" />
      </button>
    </div>
  );
}
