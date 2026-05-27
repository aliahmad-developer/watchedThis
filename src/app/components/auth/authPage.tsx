"use client";

import ProfilePictureUpdate from "./authComponent/profilePic";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SignupForm from "./signUpForm";
import LoginForm from "./loginForm";
import ForgotPasswordForm from "./forgotPasswordForm";
import { logout } from "./auth";
import EmailVerification from "./authComponent/emailVerification";
import UsernameUpdate from "./authComponent/userNameUpdate";
import PasswordUpdate from "./authComponent/passwordUpdate";
import Message from "./authComponent/message";
import { useAuth } from "../../context/authContext";

// Cache for Firestore data
const userInfoCache = new Map<
  string,
  { createdDate: string; photoURL: string | null; displayName: string }
>();

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
  const searchParams = useSearchParams();

  // Local UI state
  const [mode, setMode] = useState<"signup" | "login" | "forgot">("signup");
  const [isVerified, setIsVerified] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [displayPhotoURL, setDisplayPhotoURL] = useState<string | null>(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const [createdDate, setCreatedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for polling and cache tracking
  const lastVerifiedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchedUIDs = useRef(new Set<string>());

  const showMessage = useCallback((text: string, isError = false) => {
    setMessage(text);
    if (isError) setError(text);
    setMessageKey((p) => p + 1);
    setTimeout(() => {
      setMessage("");
      if (isError) setError(null);
    }, 5000);
  }, []);

  const getSafeCreatedDate = useCallback((u: any) => {
    return u.metadata?.creationTime
      ? new Date(u.metadata.creationTime).toLocaleDateString()
      : new Date().toLocaleDateString();
  }, []);

  // Fetch Firestore created date (background, doesn’t block UI)
  const fetchFirestoreCreatedDate = useCallback(async (uid: string) => {
    try {
      const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
      const { getFirebaseDB } = await import("../../firebase/firebaseConfig");
      const { doc, getDoc } = await import("firebase/firestore");

      // Wait for auth to be ready before hitting Firestore
      const auth = await getFirebaseAuth();
      await new Promise<void>((resolve) => {
        if (auth.currentUser) return resolve();
        const unsub = auth.onAuthStateChanged((u) => {
          if (u) {
            unsub();
            resolve();
          }
        });
        // Don't wait forever
        setTimeout(() => {
          unsub();
          resolve();
        }, 4000);
      });

      const db = getFirebaseDB();
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore timeout")), 8000),
      );

      const userDoc = await Promise.race([
        getDoc(doc(db, "users", uid)),
        timeout,
      ]);

      const snap = userDoc as any;
      if (snap.exists()) {
        const firestoreDate = snap
          .data()
          ?.createdAt?.toDate?.()
          ?.toLocaleDateString();
        if (firestoreDate) {
          setCreatedDate(firestoreDate);
          const cached = userInfoCache.get(uid);
          if (cached) {
            userInfoCache.set(uid, { ...cached, createdDate: firestoreDate });
          }
        }
      }
    } catch (err) {
      console.error("[Firestore User Fetch]", err);
    }
  }, []);

  // Sync local state when user changes
  useEffect(() => {
    if (!user) {
      // Reset all local state when signed out
      setIsVerified(false);
      setNewUsername("");
      setDisplayPhotoURL(null);
      setCreatedDate(null);
      fetchedUIDs.current.clear();
      return;
    }

    const uid = user.uid;
    const cached = userInfoCache.get(uid);

    if (cached && fetchedUIDs.current.has(uid)) {
      // Use cached data
      setIsVerified(user.emailVerified || false);
      lastVerifiedRef.current = user.emailVerified || false;
      setCreatedDate(cached.createdDate);
      setDisplayPhotoURL(cached.photoURL);
      setNewUsername(cached.displayName);
    } else {
      // Fresh user – set from Firebase and try Firestore in background
      setIsVerified(user.emailVerified || false);
      lastVerifiedRef.current = user.emailVerified || false;
      setDisplayPhotoURL(user.photoURL ?? null);
      setNewUsername(user.displayName || "");
      setCreatedDate(getSafeCreatedDate(user));
      fetchedUIDs.current.add(uid);

      // Cache what we have now
      userInfoCache.set(uid, {
        createdDate: getSafeCreatedDate(user),
        photoURL: user.photoURL ?? null,
        displayName: user.displayName || "",
      });

      // Fetch Firestore date in background
      fetchFirestoreCreatedDate(uid);
    }
  }, [user, getSafeCreatedDate, fetchFirestoreCreatedDate]);

  // Periodic email verification check (only when user exists and not verified)
  useEffect(() => {
    if (!user || isVerified) return;

    const checkVerification = async () => {
      try {
        const { getFirebaseAuth } =
          await import("../../firebase/firebaseConfig");
        const auth = await getFirebaseAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        await currentUser.reload();
        if (currentUser.emailVerified && !lastVerifiedRef.current) {
          setIsVerified(true);
          showMessage("Email verified successfully!");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        lastVerifiedRef.current = currentUser.emailVerified || false;
      } catch (err) {
        console.error("Verification check failed", err);
      }
    };

    const interval = setInterval(checkVerification, 5000);
    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [user, isVerified, showMessage]);

  // Auto-login after email verification redirect
  useEffect(() => {
    if (user || status !== "unauthenticated") return;
    if (searchParams.get("verified") !== "true") return;

    const signInAfterVerification = async () => {
      try {
        const res = await fetch("/api/auth/clientToken");
        if (!res.ok) return;
        const { customToken } = await res.json();
        if (!customToken) return;

        const { getFirebaseAuth } =
          await import("../../firebase/firebaseConfig");
        const { signInWithCustomToken } = await import("firebase/auth");
        const auth = await getFirebaseAuth();
        await signInWithCustomToken(auth, customToken);
        // Context will update automatically
      } catch (err) {
        console.error("[authPage] auto sign-in after verification failed", err);
      }
    };

    signInAfterVerification();
  }, [user, status, searchParams]);

  // Update local username when user.displayName changes (e.g., after update)
  useEffect(() => {
    if (user?.displayName) {
      setNewUsername(user.displayName);
      const uid = user.uid;
      const cached = userInfoCache.get(uid);
      if (cached) {
        userInfoCache.set(uid, { ...cached, displayName: user.displayName });
      }
    }
  }, [user?.displayName]);

  // Update photo URL cache when it changes
  useEffect(() => {
    if (user?.photoURL && user.uid) {
      const uid = user.uid;
      const cached = userInfoCache.get(uid);
      if (cached) {
        userInfoCache.set(uid, { ...cached, photoURL: user.photoURL });
      }
    }
  }, [user?.photoURL, user?.uid]);

  const handleUsernameUpdate = useCallback(async () => {
    if (!user || !newUsername.trim()) return;

    setIsUpdatingUsername(true);
    try {
      const { updateProfile } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
      const auth = await getFirebaseAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user");

      await updateProfile(currentUser, { displayName: newUsername.trim() });
      await currentUser.reload();

      // Update local state
      setNewUsername(currentUser.displayName || "");
      const uid = currentUser.uid;
      const cached = userInfoCache.get(uid);
      if (cached) {
        userInfoCache.set(uid, {
          ...cached,
          displayName: currentUser.displayName || "",
        });
      }

      window.dispatchEvent(new CustomEvent("signup-username-ready"));
      showMessage("Username updated successfully");
    } catch (err: any) {
      showMessage(err.message || "Failed to update username", true);
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
        const { getFirebaseAuth } =
          await import("../../firebase/firebaseConfig");
        const {
          EmailAuthProvider,
          reauthenticateWithCredential,
          updatePassword,
        } = await import("firebase/auth");
        const auth = await getFirebaseAuth();
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email)
          throw new Error("User not found");

        const credential = EmailAuthProvider.credential(
          currentUser.email,
          oldPassword,
        );
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        await currentUser.getIdToken(true);
        resetFields();
        showMessage("Password updated successfully");
      } catch (err: any) {
        showMessage(err.message || "Failed to update password", true);
        throw err;
      }
    },
    [user, showMessage],
  );

  const handleSendVerification = useCallback(async () => {
    if (!user?.email) return;

    setIsSendingVerification(true);
    try {
      const res = await fetch("/api/auth/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMessage("Verification email sent. Check your inbox.");
    } catch (err: any) {
      showMessage(err.message || "Failed to send verification", true);
    } finally {
      setIsSendingVerification(false);
    }
  }, [user, showMessage]);

  const handleLogout = useCallback(async () => {
    try {
      const uid = user?.uid;
      if (uid) userInfoCache.delete(uid);
      await logout();
      window.dispatchEvent(new Event("auth-updated"));
      router.push("/");
    } catch (err: any) {
      showMessage(err.message || "Failed to logout", true);
    }
  }, [user, router, showMessage]);

  const profileCard = useMemo(() => {
    if (!user) return null;
    return (
      <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md space-y-2.5">
        <div className="flex flex-col items-center gap-1 pb-2.5 border-b border-light-border dark:border-dark-border">
          <ProfilePictureUpdate
            user={user}
            onUpdated={(newPhotoURL) => {
              setDisplayPhotoURL(newPhotoURL);
              const uid = user.uid;
              const cached = userInfoCache.get(uid);
              if (cached) {
                userInfoCache.set(uid, { ...cached, photoURL: newPhotoURL });
              }
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
    displayPhotoURL,
    handleSendVerification,
    handleUsernameUpdate,
    handlePasswordUpdate,
    handleLogout,
    router,
  ]);

  // Loading state from context
  if (status === "loading") {
    return (
      <PageWrapper>
        <SkeletonLoader />
      </PageWrapper>
    );
  }

  // Authenticated -> show profile card
  if (user) {
    return <PageWrapper>{profileCard}</PageWrapper>;
  }

  // Unauthenticated -> show auth forms
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
