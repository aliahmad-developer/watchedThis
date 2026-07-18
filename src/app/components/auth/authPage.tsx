"use client";

import ProfilePictureUpdate from "./authComponent/profilePic";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import SignupForm from "./signUpForm";
import LoginForm from "./loginForm";
import ForgotPasswordForm from "./forgotPasswordForm";
import { logout } from "./auth";
import EmailVerification from "./authComponent/emailVerification";
import UsernameUpdate from "./authComponent/userNameUpdate";
import PasswordUpdate from "./authComponent/passwordUpdate";
import Message from "./authComponent/message";
import { useAuth } from "../../context/authContext";
import { createClient } from "@/lib/supabase/client";

const SkeletonLoader = () => (
  <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md space-y-3">
    <div className="flex flex-col items-center gap-2">
      <div className="w-24 h-24 rounded-full bg-light-border dark:bg-dark-border animate-pulse" />
      <div className="h-3 bg-light-border dark:bg-dark-border rounded w-24 animate-pulse" />
    </div>
    {[0, 1, 2, 3].map((i) => (
      <div key={i}>
        <div className="h-3 bg-light-border dark:bg-dark-border rounded mb-1.5 w-1/4 animate-pulse" />
        <div className="h-8 bg-light-border dark:bg-dark-border rounded animate-pulse" />
      </div>
    ))}
    <div className="h-8 bg-light-border dark:bg-dark-border rounded animate-pulse" />
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center w-full px-4 pt-4 pb-6 sm:pt-8 sm:min-h-[calc(100vh-160px)]">
    {children}
  </div>
);

export default function AuthPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"signup" | "login" | "forgot">("signup");
  const [isVerified, setIsVerified] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [displayPhotoURL, setDisplayPhotoURL] = useState<string | null>(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const lastVerifiedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const createdDate = useMemo(() => {
    if (!user?.created_at) return null;
    return new Date(user.created_at).toLocaleDateString();
  }, [user?.created_at]);

  const showMessage = useCallback((text: string, isError = false) => {
    setMessage(text);
    if (isError) setError(text);
    setMessageKey((p) => p + 1);
    setTimeout(() => {
      setMessage("");
      if (isError) setError(null);
    }, 5000);
  }, []);

  // Sync local state when user changes
  useEffect(() => {
    if (!user) {
      setIsVerified(false);
      setNewUsername("");
      setDisplayPhotoURL(null);
      return;
    }

    const verified = !!user.email_confirmed_at;
    setIsVerified(verified);
    lastVerifiedRef.current = verified;
    setDisplayPhotoURL((user.user_metadata?.avatar_url as string) ?? null);
    setNewUsername((user.user_metadata?.full_name as string) ?? "");
  }, [user]);

  // Periodic email verification check
  useEffect(() => {
    if (!user || isVerified) return;

    const checkVerification = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: freshUser },
        } = await supabase.auth.getUser();
        if (!freshUser) return;

        const verified = !!freshUser.email_confirmed_at;
        if (verified && !lastVerifiedRef.current) {
          setIsVerified(true);
          showMessage("Email verified successfully!");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        lastVerifiedRef.current = verified;
      } catch (err) {
        console.error("Verification check failed", err);
      }
    };

    const interval = setInterval(checkVerification, 5000);
    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [user, isVerified, showMessage]);

  const handleUsernameUpdate = useCallback(async () => {
    if (!user || !newUsername.trim()) return;

    setIsUpdatingUsername(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: newUsername.trim() },
      });
      if (updateError) throw updateError;

      window.dispatchEvent(new CustomEvent("signup-username-ready"));
      showMessage("Username updated successfully");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Failed to update username",
        true,
      );
    } finally {
      setIsUpdatingUsername(false);
    }
  }, [user, newUsername, showMessage]);

  const handlePasswordUpdate = useCallback(
    async ({
      oldPassword,
      newPassword,
      confirmPassword,
      resetFields,
    }: {
      oldPassword: string;
      newPassword: string;
      confirmPassword: string;
      resetFields: () => void;
    }) => {
      if (!user || !user.email) {
        showMessage("No user logged in", true);
        return;
      }
      if (newPassword !== confirmPassword) {
        showMessage("Passwords do not match", true);
        return;
      }

      try {
        const supabase = createClient();

        // Reauth: Supabase has no reauthenticateWithCredential equivalent —
        // sign in again with the old password to confirm identity
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: oldPassword,
        });
        if (reauthError) throw new Error("Current password is incorrect");

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (updateError) throw updateError;

        resetFields();
        showMessage("Password updated successfully");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update password";
        showMessage(msg, true);
        throw err;
      }
    },
    [user, showMessage],
  );

  const handleSendVerification = useCallback(async () => {
    if (!user?.email) return;

    setIsSendingVerification(true);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (resendError) throw resendError;
      showMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Failed to send verification",
        true,
      );
    } finally {
      setIsSendingVerification(false);
    }
  }, [user, showMessage]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      window.dispatchEvent(new Event("auth-updated"));
      router.push("/");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to logout", true);
    }
  }, [router, showMessage]);

  const profileCard = useMemo(() => {
    if (!user) return null;
    return (
      <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md space-y-2.5">
        <div className="flex flex-col items-center gap-1 pb-2.5 border-b border-light-border dark:border-dark-border">
          <ProfilePictureUpdate
            user={user}
            onUpdated={(newPhotoURL) => {
              setDisplayPhotoURL(newPhotoURL);
            }}
          />
          <h2 className="text-sm sm:text-base font-semibold text-center">
            {`Welcome, ${newUsername || user.email?.split("@")[0] || "User"}!`}
          </h2>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
            Email
          </label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="w-full border rounded-lg px-2.5 py-1.5 text-xs border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text outline-none cursor-not-allowed"
          />
        </div>

        <EmailVerification
          user={user}
          isVerified={isVerified}
          handleSendVerification={handleSendVerification}
          isSendingVerification={isSendingVerification}
          onVerified={() => router.replace("/")}
        />

        <UsernameUpdate
          newUsername={newUsername}
          setNewUsername={setNewUsername}
          handleUsernameUpdate={handleUsernameUpdate}
          isUpdatingUsername={isUpdatingUsername}
          user={user}
        />

        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
            Account Created
          </label>
          <input
            type="text"
            value={createdDate ?? "Loading..."}
            disabled
            className="w-full border rounded-lg px-2.5 py-1.5 text-xs cursor-not-allowed border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-body-text dark:text-dark-body-text outline-none"
          />
        </div>

        <PasswordUpdate handlePasswordUpdate={handlePasswordUpdate} />
        <Message message={message} messageKey={messageKey} />

        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-lg font-medium text-xs w-full bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }, [
    user,
    newUsername,
    isVerified,
    createdDate,
    message,
    messageKey,
    isUpdatingUsername,
    isSendingVerification,
    handleSendVerification,
    handleUsernameUpdate,
    handlePasswordUpdate,
    handleLogout,
    router,
  ]);

  if (status === "loading") {
    return (
      <PageWrapper>
        <SkeletonLoader />
      </PageWrapper>
    );
  }

  if (user) {
    return <PageWrapper>{profileCard}</PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
        {mode !== "forgot" && (
          <div className="flex mb-4 border-b border-light-border dark:border-dark-border">
            {(["signup", "login"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={[
                  "flex-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px bg-transparent",
                  mode === tab
                    ? "border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent"
                    : "border-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text",
                ].join(" ")}
              >
                {tab === "signup" ? "Sign Up" : "Login"}
              </button>
            ))}
          </div>
        )}
        {mode === "signup" && (
          <SignupForm
            onError={(e) => showMessage(e, true)}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
        {mode === "login" && (
          <LoginForm
            onSuccess={() => {}}
            onError={(e) => showMessage(e, true)}
            onForgotPassword={() => setMode("forgot")}
            onSwitchToSignup={() => setMode("signup")}
          />
        )}
        {mode === "forgot" && (
          <ForgotPasswordForm
            onBack={() => setMode("login")}
            onSuccess={() =>
              showMessage("Password reset email sent! Check your inbox.")
            }
          />
        )}
      </div>
    </PageWrapper>
  );
}