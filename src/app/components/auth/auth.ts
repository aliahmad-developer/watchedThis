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
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

// Friendly messages for Firebase auth error codes
const friendlyAuthError = (
  code: string
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
      return {
        message: "Password is too weak. Please choose a stronger one.",
      };
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return {
        message:
          "No account found with these details. Check your credentials or sign up.",
        noAccount: true,
      };
    case "auth/wrong-password":
      return {
        message:
          "Incorrect password. Please try again or reset your password.",
      };
    case "auth/too-many-requests":
      return {
        message: "Too many failed attempts. Please wait a moment and try again.",
      };
    case "auth/user-disabled":
      return {
        message: "This account has been disabled. Please contact support.",
      };
    case "auth/popup-blocked":
      return {
        message:
          "Popup was blocked. Please allow popups for this site and try again.",
      };
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return { message: "Sign-in was cancelled." };
    case "auth/account-exists-with-different-credential":
      return {
        message:
          "An account already exists with this email using a different sign-in method.",
        accountExists: true,
      };
    default:
      return { message: "Something went wrong. Please try again." };
  }
};

// Signup
export async function signup(
  email: string,
  password: string,
  username: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: username,
      createdAt: serverTimestamp(),
    });

    await updateProfile(user, { displayName: username });
    await user.getIdToken(true);
    await sendEmailVerification(user);

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

// Email login
export const login = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true, message: "Login successful!" };
  } catch (error: any) {
    const { message, noAccount } = friendlyAuthError(error.code);
    return { success: false, message, noAccount };
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true, message: "Logged out successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

// OAuth via popup on ALL devices (desktop + mobile).
// signInWithRedirect is intentionally removed — it fails silently on mobile
// browsers (Safari/Chrome) hosted on Vercel because cross-origin cookie
// restrictions block Firebase from reading back the redirect credential.
// Popups work reliably on all modern mobile browsers.
async function oauthSignIn(provider: GoogleAuthProvider | OAuthProvider) {
  try {
    const result = await signInWithPopup(auth, provider);
    return {
      success: true,
      redirect: false,
      user: result.user,
    };
  } catch (error: any) {
    console.error("OAuth error:", error.code, error.message);
    const { message } = friendlyAuthError(error.code);
    return {
      success: false,
      redirect: false,
      user: null,
      message,
    };
  }
}

// Google login
export async function signInWithGoogle() {
  return oauthSignIn(googleProvider);
}

// Apple login
export async function signInWithApple() {
  return oauthSignIn(appleProvider);
}

// Kept as a no-op for API compatibility — redirect is no longer used.
export async function checkRedirectResult() {
  return { success: false, redirect: false, user: null, message: undefined };
}

// Forgot password
export async function forgotPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: "Password reset email sent!",
    };
  } catch (error: any) {
    const { message } = friendlyAuthError(error.code);
    return {
      success: false,
      message,
    };
  }
}