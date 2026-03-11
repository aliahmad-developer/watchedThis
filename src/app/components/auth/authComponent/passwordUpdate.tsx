"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faEye, faEyeSlash, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
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

export default function PasswordUpdate({ handlePasswordUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await handlePasswordUpdate({
        oldPassword,
        newPassword,
        confirmPassword,
        resetFields: () => {
          setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setOpen(false);
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
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 py-1.5 px-1 text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent transition-colors bg-transparent w-fit"
      >
        <FontAwesomeIcon icon={faKey} className="w-3 h-3" />
        Change Password
      </button>

      {open && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          <InputWithToggle placeholder="Old password"        value={oldPassword}     setValue={setOldPassword}     show={showOld}     setShow={setShowOld} />
          <InputWithToggle placeholder="New password"        value={newPassword}     setValue={setNewPassword}     show={showNew}     setShow={setShowNew}     minLength={6} />
          <InputWithToggle placeholder="Confirm new password" value={confirmPassword} setValue={setConfirmPassword} show={showConfirm} setShow={setShowConfirm} minLength={6} />

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors
              ${isSaving
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-progress"
                : "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
              }`}
          >
            {isSaving
              ? <><FontAwesomeIcon icon={faCircleNotch} className="w-3 h-3 animate-spin" /> Saving...</>
              : "Save Password"
            }
          </button>
        </div>
      )}
    </div>
  );
}

function InputWithToggle({ placeholder, value, setValue, show, setShow, minLength }: {
  placeholder: string; value: string; setValue: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void; minLength?: number;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        minLength={minLength}
        className="w-full border rounded-lg px-2.5 py-1.5 text-xs pr-8
          border-light-border dark:border-dark-border
          bg-light-bg dark:bg-dark-bg
          text-light-body-text dark:text-dark-body-text
          focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 bg-transparent"
      >
        <FontAwesomeIcon icon={show ? faEye : faEyeSlash} className="w-3 h-3" />
      </button>
    </div>
  );
}