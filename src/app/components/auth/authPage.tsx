"use client";
import ProfilePictureUpdate from "./authComponent/profilePic";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SignupForm from "./signUpForm";
import LoginForm from "./loginForm";
import ForgotPasswordForm from "./forgotPasswordForm";
import { auth, sendEmailVerification, db } from "../../firebase/firebaseConfig";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { logout, checkRedirectResult } from "./auth";
import { doc, getDoc } from "firebase/firestore";
import EmailVerification from "./authComponent/emailVerification";
import UsernameUpdate from "./authComponent/userNameUpdate";
import PasswordUpdate from "./authComponent/passwordUpdate";
import Message from "./authComponent/message";

const SkeletonLoader = () => (
  <div className="flex flex-col items-center justify-center h-full p-3">
    <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-4 w-full max-w-xs sm:max-w-sm space-y-3">
      <div className="flex flex-col items-center gap-2">
        <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse" />
      </div>
      {[0,1,2,3].map(i => (
        <div key={i}>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mb-1.5 w-1/4 animate-pulse" />
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
);

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login" | "forgot">("signup");
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [displayPhotoURL, setDisplayPhotoURL] = useState<string | null>(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const [createdDate, setCreatedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const lastVerifiedRef = useRef(false);

  const showMessage = (text: string, isError = false) => {
    setMessage(text);
    if (isError) setError(text);
    setMessageKey(p => p + 1);
    setTimeout(() => { setMessage(""); if (isError) setError(null); }, 5000);
  };

  const getSafeCreatedDate = (u: User) =>
    u.metadata.creationTime
      ? new Date(u.metadata.creationTime).toLocaleDateString()
      : new Date().toLocaleDateString();

  // Always read from auth.currentUser — never pass stale user object
  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await currentUser.reload();
      // Re-read after reload to get fresh data
      const freshUser = auth.currentUser!;

      setUser(freshUser);
      setIsVerified(freshUser.emailVerified);
      lastVerifiedRef.current = freshUser.emailVerified;
      setNewUsername(freshUser.displayName || "");
      setDisplayPhotoURL(freshUser.photoURL ?? null);

      try {
        const userDoc = await getDoc(doc(db, "users", freshUser.uid));
        setCreatedDate(
          userDoc.exists()
            ? userDoc.data().createdAt?.toDate?.().toLocaleDateString() || getSafeCreatedDate(freshUser)
            : getSafeCreatedDate(freshUser)
        );
      } catch {
        setCreatedDate(getSafeCreatedDate(freshUser));
      }
    } catch {
      showMessage("Failed to refresh user information", true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: number | null = null;
    let unsubscribe: (() => void) | undefined;
    setIsLoading(true);

    const init = async () => {
      const redirectResult = await checkRedirectResult();
      if (!redirectResult.success && redirectResult.message) showMessage(redirectResult.message, true);

      unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (interval) { clearInterval(interval); interval = null; }
        try {
          if (!u) {
            setUser(null); setIsVerified(false); setNewUsername("");
            setDisplayPhotoURL(null); setCreatedDate(null);
            lastVerifiedRef.current = false; setIsLoading(false);
            return;
          }
          await fetchUserInfo();
          interval = window.setInterval(async () => {
            try {
              const cu = auth.currentUser;
              if (!cu) return;
              await cu.reload();
              if (!lastVerifiedRef.current && cu.emailVerified) {
                setIsVerified(true);
                showMessage("Email verified successfully!");
                if (interval) clearInterval(interval);
              }
              lastVerifiedRef.current = cu.emailVerified;
            } catch {}
          }, 5000);
        } catch {
          showMessage("Failed to authenticate user", true);
          setIsLoading(false);
        }
      });
    };

    init();
    return () => { unsubscribe?.(); if (interval) clearInterval(interval); };
  }, []);

  const handleUsernameUpdate = async () => {
    const currentUser = auth.currentUser; // always fresh
    if (!currentUser || !newUsername) return;
    setIsUpdatingUsername(true);
    try {
      await updateProfile(currentUser, { displayName: newUsername });
      await currentUser.reload();
      setUser(auth.currentUser!);
      setNewUsername(auth.currentUser!.displayName || "");
      window.dispatchEvent(new CustomEvent("signup-username-ready"));
    } catch (err: any) {
      throw err;
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handlePasswordUpdate = async ({ oldPassword, newPassword, confirmPassword, resetFields }:
    { oldPassword: string; newPassword: string; confirmPassword: string; resetFields: () => void }) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return;
    if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
    const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
    await currentUser.getIdToken(true);
    resetFields();
  };

  const handleSendVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsSendingVerification(true);
    try {
      await sendEmailVerification(currentUser);
      showMessage("Verification email sent! Check your inbox.");
    } catch (err: any) {
      showMessage(err.message || "Failed to send verification email", true);
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (isLoading) return <SkeletonLoader />;

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-3 w-full">
        <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3 sm:p-4 w-full max-w-xs sm:max-w-sm space-y-2.5">

          {/* Avatar + name header */}
          <div className="flex flex-col items-center gap-1 pb-2.5 border-b border-light-border dark:border-dark-border">
            <ProfilePictureUpdate
              user={user}
              onUpdated={(newPhotoURL) => setDisplayPhotoURL(newPhotoURL)}
            />
            <h2 className="text-sm sm:text-base font-semibold text-center">
              {`Welcome, ${newUsername || user.email?.split("@")[0]}!`}
            </h2>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">Email</label>
            <input type="email" value={user.email || ""} disabled
              className="w-full border rounded-lg px-2.5 py-1.5 text-xs
                border-light-border dark:border-dark-border
                bg-light-bg dark:bg-dark-bg
                text-light-body-text dark:text-dark-body-text
                outline-none cursor-not-allowed" />
          </div>

          <EmailVerification
            user={user}
            isVerified={isVerified}
            handleSendVerification={handleSendVerification}
            isSendingVerification={isSendingVerification}
          />

          <UsernameUpdate
            newUsername={newUsername}
            setNewUsername={setNewUsername}
            handleUsernameUpdate={handleUsernameUpdate}
            isUpdatingUsername={isUpdatingUsername}
          />

          {/* Account created */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-light-secondary-text dark:text-dark-secondary-text">Account Created</label>
            <input type="text" value={createdDate ?? "Loading..."} disabled
              className="w-full border rounded-lg px-2.5 py-1.5 text-xs cursor-not-allowed
                border-light-border dark:border-dark-border
                bg-light-bg dark:bg-dark-bg
                text-light-body-text dark:text-dark-body-text outline-none" />
          </div>

          <PasswordUpdate handlePasswordUpdate={handlePasswordUpdate} />

          <Message message={message} messageKey={messageKey} />

          <button
            onClick={async () => {
              try { await logout(); setUser(null); setIsVerified(false); router.push("/user/profile"); }
              catch (err: any) { showMessage(err.message || "Failed to logout", true); }
            }}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg font-medium text-xs w-full
              bg-light-btn-bg text-light-btn-text
              hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
              dark:bg-dark-btn-bg dark:text-dark-btn-text
              dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
              transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start sm:justify-center sm:min-h-screen pt-6 sm:pt-0 px-4 pb-6">
      <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-4 sm:p-5 w-full max-w-sm">
        {mode !== "forgot" && (
          <div className="flex mb-4 border-b border-light-border dark:border-dark-border">
            {(["signup", "login"] as const).map(tab => (
              <button key={tab} onClick={() => setMode(tab)}
                className={["flex-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px bg-transparent",
                  mode === tab
                    ? "border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent"
                    : "border-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text",
                ].join(" ")}>
                {tab === "signup" ? "Sign Up" : "Login"}
              </button>
            ))}
          </div>
        )}
        {mode === "signup" && (
          <SignupForm
            onSuccess={(newUser: User, username: string) => {
              setUser(newUser); setNewUsername(username);
              setIsVerified(newUser.emailVerified);
              setCreatedDate(newUser.metadata.creationTime
                ? new Date(newUser.metadata.creationTime).toLocaleDateString() : "Unknown");
              window.dispatchEvent(new CustomEvent("signup-username-ready"));
            }}
            onError={e => showMessage(e, true)}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
        {mode === "login" && (
          <LoginForm onSuccess={() => {}} onError={e => showMessage(e, true)}
            onForgotPassword={() => setMode("forgot")} onSwitchToSignup={() => setMode("signup")} />
        )}
        {mode === "forgot" && (
          <ForgotPasswordForm onBack={() => setMode("login")}
            onSuccess={() => showMessage("Password reset email sent! Check your inbox.")} />
        )}
      </div>
    </div>
  );
}