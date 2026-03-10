"use client";
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

// Skeleton Loader Component
const SkeletonLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-3">
      <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-4 w-full max-w-xs sm:max-w-sm">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 animate-pulse mx-auto w-3/4"></div>
        <div className="mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/2 animate-pulse"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/3 animate-pulse"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/2 animate-pulse"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login" | "forgot">("signup");
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const [createdDate, setCreatedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const lastVerifiedRef = useRef(false);
  // Holds the cleanup fn returned by runInit so pageshow can tear down and restart
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  const showMessage = (text: string, isError = false) => {
    setMessage(text);
    if (isError) setError(text);
    setMessageKey((prev) => prev + 1);
    setTimeout(() => {
      setMessage("");
      if (isError) setError(null);
    }, 5000);
  };

  const getSafeCreatedDate = (u: User) =>
    u.metadata.creationTime
      ? new Date(u.metadata.creationTime).toLocaleDateString()
      : new Date().toLocaleDateString();

  const fetchUserInfo = async (u: User) => {
    try {
      setIsLoading(true);
      await u.reload();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      setUser(currentUser);
      setIsVerified(currentUser.emailVerified);
      lastVerifiedRef.current = currentUser.emailVerified;
      setNewUsername(currentUser.displayName || "");

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCreatedDate(
            data.createdAt?.toDate?.().toLocaleDateString() ||
              getSafeCreatedDate(currentUser)
          );
        } else {
          setCreatedDate(getSafeCreatedDate(currentUser));
        }
      } catch (err) {
        console.error("Error fetching Firestore data:", err);
        setCreatedDate(getSafeCreatedDate(currentUser));
        showMessage("Couldn't load account details, using default information", true);
      }
    } catch (err) {
      console.error("Error reloading user:", err);
      showMessage("Failed to refresh user information", true);
    } finally {
      setIsLoading(false);
    }
  };

  // Extracted so it can be re-run when the page is restored from bfcache
  const runInit = async (): Promise<() => void> => {
    let interval: number | null = null;

    // 1. Consume any pending OAuth redirect result FIRST (critical for mobile)
    const redirectResult = await checkRedirectResult();
    if (!redirectResult.success && redirectResult.message) {
      showMessage(redirectResult.message, true);
    }

    // 2. Subscribe to auth state AFTER redirect is resolved
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      try {
        if (!u) {
          setUser(null);
          setIsVerified(false);
          setNewUsername("");
          setCreatedDate(null);
          lastVerifiedRef.current = false;
          setIsLoading(false);
          return;
        }

        await fetchUserInfo(u);

        // Poll every 5s to detect email verification
        interval = window.setInterval(async () => {
          try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            await currentUser.reload();
            if (!lastVerifiedRef.current && currentUser.emailVerified) {
              setIsVerified(true);
              showMessage("Email verified successfully!");
              if (interval) clearInterval(interval);
            }
            lastVerifiedRef.current = currentUser.emailVerified;
          } catch (err) {
            console.error("Error during email verification polling:", err);
          }
        }, 5000);
      } catch (err) {
        console.error("Error in auth state change:", err);
        showMessage("Failed to authenticate user", true);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  };

  useEffect(() => {
    setIsLoading(true);
    runInit().then((fn) => {
      cleanupRef.current = fn;
    });

    // ─────────────────────────────────────────────────────────────
    // MOBILE bfcache FIX
    //
    // On mobile (Safari/Chrome), after signInWithRedirect, Google
    // redirects the user back to the app. The browser often restores
    // the previous page from the back-forward cache (bfcache) instead
    // of doing a full reload. When this happens:
    //   - The page JS is frozen/resumed, NOT re-executed
    //   - onAuthStateChanged has already fired with null (before login)
    //   - checkRedirectResult is never called again
    //   - Result: user is authenticated in Firebase but UI shows login form
    //
    // The `pageshow` event fires on EVERY page display including bfcache
    // restores. When `e.persisted === true`, the page came from bfcache,
    // so we tear down stale listeners and re-run the full init to pick
    // up the authenticated user correctly.
    // ─────────────────────────────────────────────────────────────
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        cleanupRef.current?.();
        setIsLoading(true);
        runInit().then((fn) => {
          cleanupRef.current = fn;
        });
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cleanupRef.current?.();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleUsernameUpdate = async () => {
    if (!user || !newUsername) return;
    setIsUpdatingUsername(true);
    try {
      await updateProfile(user, { displayName: newUsername });
      await fetchUserInfo(user);
      showMessage("Username updated successfully!");
    } catch (err: any) {
      showMessage(err.message || "Failed to update username", true);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handlePasswordUpdate = async ({
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
    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      showMessage("New password and confirm password do not match.", true);
      return;
    }

    try {
      const {
        EmailAuthProvider,
        reauthenticateWithCredential,
        updatePassword,
      } = await import("firebase/auth");
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await user.getIdToken(true);
      await fetchUserInfo(user);
      showMessage("Password updated successfully!");
      resetFields();
    } catch (err: any) {
      const errorMessage =
        err.code === "auth/user-token-expired"
          ? "Your session expired. Please log in again."
          : err.message || "Failed to update password";
      showMessage(errorMessage, true);
    }
  };

  const handleSendVerification = async () => {
    if (!user) return;
    setIsSendingVerification(true);
    try {
      await sendEmailVerification(user);
      showMessage("Verification email sent! Check your inbox.");
    } catch (err: any) {
      showMessage(err.message || "Failed to send verification email", true);
    } finally {
      setIsSendingVerification(false);
    }
  };

  // ---------------- UI ----------------
  if (isLoading) return <SkeletonLoader />;

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-3 w-full">
        <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3 sm:p-4 w-full max-w-xs sm:max-w-sm space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-light-header dark:text-dark-header text-center">
            {`Welcome, ${newUsername || user.email?.split("@")[0]}!`}
          </h2>

          <div className="flex flex-col">
            <label className="text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text">
              Email
            </label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="mt-1 w-full border rounded-lg p-2 text-xs sm:text-sm
              border-light-border dark:border-dark-border
              bg-light-bg dark:bg-dark-bg
              text-light-body-text dark:text-dark-body-text
              focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
            />
          </div>

          <EmailVerification
            user={user}
            isVerified={isVerified}
            handleSendVerification={handleSendVerification}
            isSendingVerification={isSendingVerification}
          />

          <UsernameUpdate
            user={user}
            newUsername={newUsername}
            setNewUsername={setNewUsername}
            handleUsernameUpdate={handleUsernameUpdate}
            isUpdatingUsername={isUpdatingUsername}
          />

          <div className="flex flex-col">
            <label className="text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text">
              Account Created
            </label>
            <input
              type="text"
              value={createdDate ?? "Loading..."}
              disabled
              className="mt-1 w-full border rounded-lg p-2 text-xs sm:text-sm cursor-not-allowed
              border-light-border dark:border-dark-border
              bg-light-bg dark:bg-dark-bg
              text-light-body-text dark:text-dark-body-text outline-none"
            />
          </div>

          <PasswordUpdate user={user} handlePasswordUpdate={handlePasswordUpdate} />

          <Message message={message} messageKey={messageKey} />

          <button
            onClick={async () => {
              try {
                await logout();
                setUser(null);
                setIsVerified(false);
                router.push("/user/profile");
              } catch (err: any) {
                showMessage(err.message || "Failed to logout", true);
              }
            }}
            className="mt-3 sm:mt-4 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm
            bg-light-btn-bg text-light-btn-text 
            hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text
            dark:bg-dark-btn-bg dark:text-dark-btn-text
            dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text
            transition-colors w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start sm:justify-center sm:min-h-screen pt-6 sm:pt-0 px-4 pb-6">
      <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-4 sm:p-5 w-full max-w-sm">

        {/* Tab buttons — hidden on forgot password view */}
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
            onSuccess={(newUser: User, username: string) => {
              setUser(newUser);
              setNewUsername(username);
              setIsVerified(newUser.emailVerified);
              setCreatedDate(
                newUser.metadata.creationTime
                  ? new Date(newUser.metadata.creationTime).toLocaleDateString()
                  : "Unknown"
              );
            }}
            onError={(error) => showMessage(error, true)}
            onSwitchToLogin={() => setMode("login")}
          />
        )}

        {mode === "login" && (
          <LoginForm
            onSuccess={() => {/* onAuthStateChanged will update user state */}}
            onError={(error) => showMessage(error, true)}
            onForgotPassword={() => setMode("forgot")}
            onSwitchToSignup={() => setMode("signup")}
          />
        )}

        {mode === "forgot" && (
          <ForgotPasswordForm
            onBack={() => setMode("login")}
            onSuccess={() => showMessage("Password reset email sent! Check your inbox.")}
          />
        )}
      </div>
    </div>
  );
}