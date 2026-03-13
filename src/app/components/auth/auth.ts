import { auth, db } from "../../firebase/firebaseConfig";
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
    //Firebase ID tokens last 1hr anyway
    document.cookie = `${SESSION_COOKIE}=${token}; path=/; SameSite=Strict; Secure; max-age=3600`;
  } catch {
    // non-critical — middleware falls back gracefully
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
        message: "No account found with these details. Check your credentials or sign up.",
        noAccount: true,
      };
    case "auth/wrong-password":
      return { message: "Incorrect password. Please try again or reset your password." };
    case "auth/too-many-requests":
      return { message: "Too many failed attempts. Please wait a moment and try again." };
    case "auth/user-disabled":
      return { message: "This account has been disabled. Please contact support." };
    case "auth/popup-blocked":
      return { message: "Popup was blocked. Please allow popups for this site and try again." };
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return { message: "Sign-in was cancelled." };
    case "auth/account-exists-with-different-credential":
      return {
        message: "An account already exists with this email using a different sign-in method.",
        accountExists: true,
      };
    default:
      return { message: "Something went wrong. Please try again." };
  }
};

// ─── Signup ────────────────────────────────────────────────────────────────
export async function signup(email: string, password: string, username: string) {
  try {
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
      message: `Signup successful! A verification email has been sent to ${email}.`,
      user,
      username,
    };
  } catch (error: any) {
    const { message, accountExists } = friendlyAuthError(error.code);
    return { success: false, message, accountExists };
  }
}

// ─── Email login ───────────────────────────────────────────────────────────
export const login = async (email: string, password: string) => {
  try {
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
    clearSessionCookie();
    await signOut(auth);
    return { success: true, message: "Logged out successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

// ─── OAuth (popup on all devices) ─────────────────────────────────────────
async function oauthSignIn(provider: GoogleAuthProvider | OAuthProvider) {
  try {
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

// No-op kept for API compatibility
export async function checkRedirectResult() {
  return { success: false, redirect: false, user: null, message: undefined };
}

// ─── Forgot password ───────────────────────────────────────────────────────
export async function forgotPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "Password reset email sent!" };
  } catch (error: any) {
    const { message } = friendlyAuthError(error.code);
    return { success: false, message };
  }
}