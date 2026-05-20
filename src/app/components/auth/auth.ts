import {
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  User,
} from "firebase/auth";

// ─── Providers ─────────────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

async function setSessionCookie(user: User): Promise<void> {
  const token = await user.getIdToken(true);

  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken: token }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Failed to create server session");
  }
}

async function clearSessionCookie(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
}
function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-updated"));
  }
}
// ─── Friendly error messages ───────────────────────────────────────────────
const friendlyAuthError = (
  code: string,
): { message: string; accountExists?: boolean; noAccount?: boolean } => {
  switch (code) {
    case "auth/email-already-in-use":
      return {
        message:
          "An account with this email already exists. Try logging in instead.",
        accountExists: true,
      };
    case "auth/invalid-email":
      return { message: "Please enter a valid email address." };
    case "auth/weak-password":
      return { message: "Password is too weak. Please choose a stronger one." };
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return {
        message: "No account found with these details.",
        noAccount: true,
      };
    case "auth/wrong-password":
      return { message: "Incorrect password." };
    case "auth/too-many-requests":
      return { message: "Too many attempts. Try again later." };
    case "auth/user-disabled":
      return { message: "This account has been disabled." };
    case "auth/popup-blocked":
      return { message: "Popup blocked. Allow popups and try again." };
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return { message: "Sign-in cancelled." };
    case "auth/account-exists-with-different-credential":
      return {
        message: "Account exists with different sign-in method.",
        accountExists: true,
      };
    default:
      return { message: "Something went wrong." };
  }
};

// ─── Sign up ───────────────────────────────────────────────────────────────
export async function signup(
  email: string,
  password: string,
  username: string,
) {
  try {
    const res = await fetch("/api/auth/sendVerification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });

    const data = await res.json();

    if (!res.ok) {
      const accountExists = res.status === 409;
      return {
        success: false,
        message: data.error || "Failed to send verification email.",
        accountExists,
      };
    }

    return {
      success: true,
      message: `Verification email sent to ${email}. Please check your inbox.`,
      user: null,
      username,
    };
  } catch {
    return { success: false, message: "Sign up failed. Please try again." };
  }
}

// ─── Resend verification email ────────────────────────────────────────────
export async function resendVerificationEmail(
  email: string,
  password: string,
  username: string,
) {
  return signup(email, password, username);
}

// ─── Login ─────────────────────────────────────────────────────────────────
export const login = async (email: string, password: string) => {
  try {
    const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
    const auth = await getFirebaseAuth();

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await setSessionCookie(userCredential.user);

    notifyAuthChange();

    return { success: true, message: "Login successful!" };
  } catch (error: any) {
    if (error.code) {
      const { message, noAccount } = friendlyAuthError(error.code);
      return { success: false, message, noAccount };
    }
    return { success: false, message: "Login failed. Please try again." };
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
    const auth = await getFirebaseAuth();

    // Always clear server session first (fast + reliable)
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });

    // Then Firebase logout
    await signOut(auth);

    notifyAuthChange();

    return { success: true, message: "Logged out successfully!" };
  } catch {
    return {
      success: false,
      message: "Logout failed. Please try again.",
    };
  }
};

// ─── OAuth ─────────────────────────────────────────────────────────────────
async function oauthSignIn(provider: GoogleAuthProvider | OAuthProvider) {
  try {
    // Cancel any active One Tap / GSI flow and wait for it to fully clear
    window.google?.accounts?.id?.cancel();
    window.google?.accounts?.id?.disableAutoSelect?.();
    await new Promise((res) => setTimeout(res, 500));

    const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
    const auth = await getFirebaseAuth();

    const result = await signInWithPopup(auth, provider);
    await setSessionCookie(result.user);

    notifyAuthChange();

    return { success: true, redirect: false, user: result.user };
  } catch (error: any) {
    if (error.code) {
      const { message } = friendlyAuthError(error.code);
      return { success: false, redirect: false, user: null, message };
    }

    return {
      success: false,
      redirect: false,
      user: null,
      message: "Sign-in failed. Please try again.",
    };
  }
}

export async function signInWithGoogle() {
  return oauthSignIn(googleProvider);
}

export async function signInWithApple() {
  return oauthSignIn(appleProvider);
}

export async function checkRedirectResult() {
  return { success: false, redirect: false, user: null };
}

// ─── Forgot password ───────────────────────────────────────────────────────
export async function forgotPassword(email: string) {
  try {
    const res = await fetch("/api/auth/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");

    return { success: true, message: "Password reset email sent!" };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to send reset email. Please try again.",
    };
  }
}
