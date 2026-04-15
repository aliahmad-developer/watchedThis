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
import type { AuthError, FirebaseUser } from "@/types/auth";
import { User } from 'firebase/auth';

// Module-level cache — persists across re-renders, cleared on logout
const userInfoCache = new Map<
  string,
  {
    createdDate: string;
    photoURL: string | null;
    displayName: string;
  }
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

  const router = useRouter();

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
      if (hasFetchedRef.current && !forceRefresh) return;

      try {
        setIsLoading(true);
        const currentUser = authRef.current?.currentUser;
        if (!currentUser) return;

        await currentUser.reload();
        const freshUser = authRef.current?.currentUser;
        if (!freshUser) return;

        setUser(freshUser);
        setIsVerified(!!freshUser.emailVerified);
        lastVerifiedRef.current = !!freshUser.emailVerified;
        setNewUsername(freshUser.displayName || "");
        setDisplayPhotoURL(freshUser.photoURL ?? null);

        // Check cache first — skip Firestore if we already have it
        const cached = userInfoCache.get(freshUser.uid);
        if (cached && !forceRefresh) {
          setCreatedDate(cached.createdDate);
          hasFetchedRef.current = true;
          return;
        }

        // Cache miss — fetch from Firestore
        if (dbRef.current) {
          try {
            const { doc, getDoc } = await import("firebase/firestore");
            const userDoc = await getDoc(
              doc(dbRef.current, "users", freshUser.uid),
            );
            const date = userDoc.exists()
              ? (userDoc
                  .data()
                  ?.createdAt?.toDate?.()
                  ?.toLocaleDateString() as string) ||
                getSafeCreatedDate(freshUser)
              : getSafeCreatedDate(freshUser);

            setCreatedDate(date);

            // Write to cache
            userInfoCache.set(freshUser.uid, {
              createdDate: date,
              photoURL: freshUser.photoURL ?? null,
              displayName: freshUser.displayName || "",
            });
          } catch {
            setCreatedDate(getSafeCreatedDate(freshUser));
          }
        }

        hasFetchedRef.current = true;
      } catch {
        showMessage("Failed to refresh user information", true);
      } finally {
        setIsLoading(false);
      }
    },
    [getSafeCreatedDate, showMessage],
  );

  // Lazy Firebase initialization
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

        unsubscribe = authInstance.onAuthStateChanged((u: FirebaseUser | null) => {
          setUser(u ?? null);
          if (u) {
            fetchUserInfo();
          } else {
            hasFetchedRef.current = false;
            setIsLoading(false);
          }
        });
      } catch (err: unknown) {
        const authError = err as AuthError;
        console.error({ level: 'error', component: 'authPage', message: authError.message });
        showMessage("Failed to initialize authentication", true);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUserInfo, showMessage]);

  // Seed username input when user loads
  useEffect(() => {
    if (user?.displayName) {
      setNewUsername(user.displayName);
    }
  }, [user?.displayName]);

  // Periodic email verification check
  useEffect(() => {
    if (!user || !authRef.current?.currentUser) return;

    // Seed ref BEFORE interval starts so already-verified users don't get the toast
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

      // Update cache with new display name
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
      showMessage("Username updated successfully!");
    } catch (err: any) {
      showMessage(err.message || "Failed to update username", true);
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
        showMessage("Password updated successfully!");
      } catch (err: any) {
        showMessage(err.message || "Failed to update password", true);
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
              // Update cache with new photo URL
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
              // Clear cache for this user on logout
              const uid = authRef.current?.currentUser?.uid;
              if (uid) userInfoCache.delete(uid);

              await logout();
              setUser(null);
              setIsVerified(false);
              setCreatedDate(null);
              setNewUsername("");
              setDisplayPhotoURL(null);
              hasFetchedRef.current = false;
              router.push("/user/profile");
            } catch (err: any) {
              showMessage(err.message || "Failed to logout", true);
            }
          }}
          disabled={isLoading}
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
            onSuccess={(newUser: any, username: string) => {
              setUser(newUser);
              setNewUsername(username);
              setIsVerified(!!newUser.emailVerified);
              const date = newUser.metadata?.creationTime
                ? new Date(newUser.metadata.creationTime).toLocaleDateString()
                : "Unknown";
              setCreatedDate(date);
              // Seed cache on signup so no Firestore read needed immediately
              userInfoCache.set(newUser.uid, {
                createdDate: date,
                photoURL: newUser.photoURL ?? null,
                displayName: username,
              });
              window.dispatchEvent(new CustomEvent("signup-username-ready"));
            }}
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