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
import type { AuthError, FirebaseUser } from "@/types/auth";
import { User } from "firebase/auth";

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
  const [auth, setAuth] = useState<any>(null);

  const authRef = useRef<any>(null);
  const dbRef = useRef<any>(null);
  const lastVerifiedRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchedUIDs = useRef(new Set<string>()); // ✅ moved to ref so it persists across renders
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const fetchUserInfo = useCallback(
    async (forceRefresh = false) => {
      const currentUser = authRef.current?.currentUser;

      if (!currentUser) return;

      const cached = userInfoCache.get(currentUser.uid);

      if (cached && !forceRefresh && fetchedUIDs.current.has(currentUser.uid)) {
        setUser(currentUser);
        setIsVerified(!!currentUser.emailVerified);

        lastVerifiedRef.current = !!currentUser.emailVerified;

        setCreatedDate(cached.createdDate);

        setDisplayPhotoURL(cached.photoURL);

        setNewUsername(cached.displayName);

        hasFetchedRef.current = true;

        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);

        await currentUser.reload();

        const freshUser = authRef.current?.currentUser;

        if (!freshUser) return;

        const fallbackDate = getSafeCreatedDate(freshUser);

        setUser(freshUser);

        setIsVerified(!!freshUser.emailVerified);

        lastVerifiedRef.current = !!freshUser.emailVerified;

        setNewUsername(freshUser.displayName || "");

        setDisplayPhotoURL(freshUser.photoURL ?? null);

        // Show immediately
        setCreatedDate(fallbackDate);

        setIsLoading(false);

        fetchedUIDs.current.add(freshUser.uid);

        hasFetchedRef.current = true;

        // Firestore runs in background
        if (dbRef.current) {
          void (async () => {
            try {
              // Ensure Firebase Auth token is attached
              await freshUser.getIdToken();

              const { doc, getDoc } = await import("firebase/firestore");

              const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore timeout")), 5000),
              );

              const userDoc = await Promise.race([
                getDoc(doc(dbRef.current, "users", freshUser.uid)),
                timeout,
              ]);

              const snap = userDoc as any;

              if (!snap.exists()) {
                console.warn("User doc missing:", freshUser.uid);

                return;
              }

              const firestoreDate = snap
                .data()
                ?.createdAt?.toDate?.()
                ?.toLocaleDateString();

              if (!firestoreDate) return;

              setCreatedDate(firestoreDate);

              userInfoCache.set(freshUser.uid, {
                createdDate: firestoreDate,
                photoURL: freshUser.photoURL ?? null,
                displayName: freshUser.displayName || "",
              });
            } catch (err) {
              console.error("[Firestore User Fetch]", err);

              console.log("Auth UID:", freshUser.uid);

              setCreatedDate(getSafeCreatedDate(freshUser));
            }
          })();
        }
      } catch {
        showMessage("Failed to refresh user information", true);

        setIsLoading(false);
      }
    },
    [getSafeCreatedDate, showMessage],
  );

  useEffect(() => {
    let unsubscribe: any;

    const init = async () => {
      try {
        const firebase = await import("../../firebase/firebaseConfig");
        const authInstance = await firebase.getFirebaseAuth();
        const dbInstance = firebase.getFirebaseDB();

        setAuth(authInstance);
        authRef.current = authInstance;
        dbRef.current = dbInstance;

        unsubscribe = authInstance.onAuthStateChanged(
          (u: FirebaseUser | null) => {
            setUser(u ?? null);
            if (u) {
              fetchUserInfo();
            } else {
              hasFetchedRef.current = false;
              setIsLoading(false);
            }
          },
        );
      } catch (err: unknown) {
        const authError = err as AuthError;
        console.error({
          level: "error",
          component: "authPage",
          message: authError.message,
        });
        showMessage("Failed to initialize authentication", true);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUserInfo, showMessage]);

  // ✅ Auto-login after email verification redirect
  // Runs only after auth is initialized; skipped if user is already signed in
  useEffect(() => {
    if (!auth || user) return;
    if (searchParams.get("verified") !== "true") return;

    const signInAfterVerification = async () => {
      try {
        const res = await fetch("/api/auth/clientToken");
        if (!res.ok) return;

        const { customToken } = await res.json();
        if (!customToken) return;

        const { signInWithCustomToken } = await import("firebase/auth");
        await signInWithCustomToken(auth, customToken);
        // onAuthStateChanged will fire and call fetchUserInfo automatically
      } catch (err) {
        console.error("[authPage] auto sign-in after verification failed", err);
      }
    };

    signInAfterVerification();
  }, [auth, user, searchParams]); // ✅ depends on auth being ready

  // Seed username input when user loads
  useEffect(() => {
    if (user?.displayName) {
      setNewUsername(user.displayName);
    }
  }, [user?.displayName]);

  // Periodic email verification check
  useEffect(() => {
    if (!user || !authRef.current?.currentUser) return;

    lastVerifiedRef.current = !!authRef.current.currentUser.emailVerified;

    const interval = setInterval(async () => {
      try {
        const cu = authRef.current?.currentUser;
        if (!cu) return;
        await cu.reload();
        if (!lastVerifiedRef.current && cu.emailVerified) {
          setIsVerified(true);
          showMessage("Email verified successfully!");
          clearInterval(interval);
        }
        lastVerifiedRef.current = !!cu.emailVerified;
      } catch {}
    }, 5000);

    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [user, showMessage]);

  const handleUsernameUpdate = useCallback(async () => {
    const currentUser = authRef.current?.currentUser;
    if (!currentUser || !newUsername.trim()) return;

    setIsUpdatingUsername(true);
    try {
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(currentUser, { displayName: newUsername.trim() });
      await currentUser.reload();
      const updated = authRef.current?.currentUser;
      setUser(updated);
      setNewUsername(updated?.displayName || "");

      const uid = updated?.uid;
      if (uid) {
        const cached = userInfoCache.get(uid);
        if (cached) {
          userInfoCache.set(uid, {
            ...cached,
            displayName: updated?.displayName || "",
          });
        }
      }

      window.dispatchEvent(new CustomEvent("signup-username-ready"));
    } catch (err: any) {
    } finally {
      setIsUpdatingUsername(false);
    }
  }, [newUsername, showMessage]);

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
      const currentUser = authRef.current?.currentUser;
      if (
        !currentUser ||
        !currentUser.email ||
        newPassword !== confirmPassword
      ) {
        showMessage("Passwords do not match or invalid user", true);
        return;
      }

      try {
        const {
          EmailAuthProvider,
          reauthenticateWithCredential,
          updatePassword,
        } = await import("firebase/auth");
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          oldPassword,
        );
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        await currentUser.getIdToken(true);
        resetFields();
      } catch (err: any) {
        throw err;
      }
    },
    [showMessage],
  );

  const handleSendVerification = useCallback(async () => {
    const currentUser = authRef.current?.currentUser;
    if (!currentUser?.email) return;

    setIsSendingVerification(true);
    try {
      const res = await fetch("/api/auth/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } finally {
      setIsSendingVerification(false);
    }
  }, []);

  const profileCard = useMemo(() => {
    if (!user) return null;
    return (
      <div className="bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md space-y-2.5">
        <div className="flex flex-col items-center gap-1 pb-2.5 border-b border-light-border dark:border-dark-border">
          <ProfilePictureUpdate
            user={user}
            onUpdated={(newPhotoURL) => {
              setDisplayPhotoURL(newPhotoURL);
              const uid = authRef.current?.currentUser?.uid;
              if (uid) {
                const cached = userInfoCache.get(uid);
                if (cached) {
                  userInfoCache.set(uid, { ...cached, photoURL: newPhotoURL });
                }
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
          onClick={async () => {
            try {
              const uid = authRef.current?.currentUser?.uid;
              if (uid) userInfoCache.delete(uid);
              await logout();
              window.dispatchEvent(new Event("auth-updated"));
              setUser(null);
              setIsVerified(false);
              setCreatedDate(null);
              setNewUsername("");
              setDisplayPhotoURL(null);
              hasFetchedRef.current = false;
              router.push("/");
            } catch (err: any) {
              showMessage(err.message || "Failed to logout", true);
            }
          }}
          disabled={false}
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
    isLoading,
    isUpdatingUsername,
    isSendingVerification,
    handleSendVerification,
    handleUsernameUpdate,
    handlePasswordUpdate,
    showMessage,
    router,
  ]);

  if (isLoading && !auth) {
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
