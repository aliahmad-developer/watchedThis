"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SignupForm from "./signUpForm";
import LoginForm from "./loginForm";
import { auth, sendEmailVerification, db } from "../../firebase/firebaseConfig";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { logout } from "./auth";
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
        {/* Header Skeleton */}
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4 animate-pulse mx-auto w-3/4"></div>
        
        {/* Email Field Skeleton */}
        <div className="mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Verification Skeleton */}
        <div className="mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/2 animate-pulse"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Username Field Skeleton */}
        <div className="mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/3 animate-pulse"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Account Created Skeleton */}
        <div className="mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/2 animate-pulse"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Logout Button Skeleton */}
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
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

  const showMessage = (text: string, isError = false) => {
    setMessage(text);
    if (isError) setError(text);
    setMessageKey((prev) => prev + 1);
    setTimeout(() => {
      setMessage("");
      if (isError) setError(null);
    }, 5000);
  };

  // Helper to safely get created date
  const getSafeCreatedDate = (u: User) =>
    u.metadata.creationTime
      ? new Date(u.metadata.creationTime).toLocaleDateString()
      : new Date().toLocaleDateString();

  // Fetch user info and Firestore timestamp
  const fetchUserInfo = async (u: User) => {
    try {
      setIsLoading(true);
      await u.reload(); // Ensure latest displayName and emailVerified
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      setUser(currentUser);
      setIsVerified(currentUser.emailVerified);
      lastVerifiedRef.current = currentUser.emailVerified;

      // Set username
      setNewUsername(currentUser.displayName || "");

      // Get createdAt from Firestore
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

  useEffect(() => {
    let interval: number | null = null;
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
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

        // Poll email verification
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
  }, []);

  const handleUsernameUpdate = async () => {
    if (!user || !newUsername) return;
    setIsUpdatingUsername(true);
    try {
      await updateProfile(user, { displayName: newUsername });
      await fetchUserInfo(user); // Refresh username after update
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
      await fetchUserInfo(user); // Refresh user after password change
      showMessage("Password updated successfully!");
      resetFields();
    } catch (err: any) {
      const errorMessage = err.code === "auth/user-token-expired"
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
  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (user) {
    return (
     <div className="flex flex-col items-center justify-center h-full p-3 w-full">
        <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3 sm:p-4 w-full max-w-xs sm:max-w-sm space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-light-header dark:text-dark-header text-center">
            {isLoading ? "Loading..." : `Welcome, ${newUsername || user.email?.split("@")[0]}! 🎉`}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs sm:text-sm rounded">
              {error}
            </div>
          )}

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

          <PasswordUpdate
            user={user}
            handlePasswordUpdate={handlePasswordUpdate}
          />

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
    <div className="flex flex-col items-center justify-center min-h-screen p-3">
      <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3 sm:p-4 w-full max-w-xs sm:max-w-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs sm:text-sm rounded mb-3">
            {error}
          </div>
        )}
        
        <div className="flex justify-around mb-3 sm:mb-4">
          <button
            onClick={() => setMode("signup")}
            className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm
            ${
              mode === "signup"
                ? "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
                : "bg-light-bg text-light-secondary-text dark:bg-dark-bg dark:text-dark-secondary-text"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode("login")}
            className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm
            ${
              mode === "login"
                ? "bg-light-btn-bg text-light-btn-text hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
                : "bg-light-bg text-light-secondary-text dark:bg-dark-bg dark:text-dark-secondary-text"
            }`}
          >
            Login
          </button>
        </div>
        
        {mode === "signup" ? (
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
          />
        ) : (
          <LoginForm onError={(error) => showMessage(error, true)} />
        )}
      </div>
    </div>
  );
}