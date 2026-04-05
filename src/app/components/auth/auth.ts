import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  User,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// ─── Providers (safe at top level) ─────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

// ─── Session cookie helpers ────────────────────────────────────────────────
const SESSION_COOKIE = "firebase-auth-token";

async function setSessionCookie(user: User) {
  try {
    const token = await user.getIdToken();
    document.cookie = `${SESSION_COOKIE}=${token}; path=/; SameSite=Strict; Secure; max-age=3600`;
  } catch {
    // non-critical
  }
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Strict; Secure`;
}

// ─── Friendly error messages ───────────────────────────────────────────────
const friendlyAuthError = (
  code: string
): { message: string; accountExists?: boolean; noAccount?: boolean } => {
  switch (code) {
    case "auth/email-already-in-use":
      return {
        message: "An account with this email already exists. Try logging in instead.",
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

// ─── Signup ────────────────────────────────────────────────────────────────
export async function signup(email: string, password: string, username: string) {
  try {
    const { getFirebaseAuth, getFirebaseDB } = await import("../../firebase/firebaseConfig");

    const auth = await getFirebaseAuth();
    const db = getFirebaseDB();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: username,
      createdAt: serverTimestamp(),
    });

    await updateProfile(user, { displayName: username });
    await user.getIdToken(true);
    await sendEmailVerification(user);
    await setSessionCookie(user);

    return {
      success: true,
      message: `Signup successful! Verification email sent to ${email}.`,
      user,
      username,
    };
  } catch (error: any) {
    const { message, accountExists } = friendlyAuthError(error.code);
    return { success: false, message, accountExists };
  }
}

// ─── Login ─────────────────────────────────────────────────────────────────
export const login = async (email: string, password: string) => {
  try {
    const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
    const auth = await getFirebaseAuth();

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await setSessionCookie(userCredential.user);

    return { success: true, message: "Login successful!" };
  } catch (error: any) {
    const { message, noAccount } = friendlyAuthError(error.code);
    return { success: false, message, noAccount };
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
    const auth = await getFirebaseAuth();

    clearSessionCookie();
    await signOut(auth);

    return { success: true, message: "Logged out successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

// ─── OAuth ────────────────────────────────────────────────────────────────
async function oauthSignIn(provider: GoogleAuthProvider | OAuthProvider) {
  try {
    const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
    const auth = await getFirebaseAuth();

    const result = await signInWithPopup(auth, provider);
    await setSessionCookie(result.user);

    return { success: true, redirect: false, user: result.user };
  } catch (error: any) {
    const { message } = friendlyAuthError(error.code);
    return { success: false, redirect: false, user: null, message };
  }
}

export async function signInWithGoogle() {
  return oauthSignIn(googleProvider);
}

export async function signInWithApple() {
  return oauthSignIn(appleProvider);
}

// ─── Redirect check (no-op) ───────────────────────────────────────────────
export async function checkRedirectResult() {
  return { success: false, redirect: false, user: null };
}

// ─── Forgot password ──────────────────────────────────────────────────────
export async function forgotPassword(email: string) {
  try {
    const { getFirebaseAuth } = await import("../../firebase/firebaseConfig");
    const auth = await getFirebaseAuth();

    await sendPasswordResetEmail(auth, email);

    return { success: true, message: "Password reset email sent!" };
  } catch (error: any) {
    const { message } = friendlyAuthError(error.code);
    return { success: false, message };
  }
}