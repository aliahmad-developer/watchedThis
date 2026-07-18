import { createClient } from "@/lib/supabase/client";

// ─── Helpers ────────────────────────────────────────────────────────────────

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-updated"));
  }
}

// ─── Friendly error messages ───────────────────────────────────────────────
// Supabase errors don't use Firebase's "auth/xxx" code format — they're plain
// message strings (sometimes a .status). Matching on message substrings instead.
const friendlyAuthError = (
  message: string,
): { message: string; accountExists?: boolean; noAccount?: boolean } => {
  const m = message.toLowerCase();

  if (m.includes("already registered") || m.includes("already exists")) {
    return {
      message: "An account with this email already exists. Try logging in instead.",
      accountExists: true,
    };
  }
  if (m.includes("invalid login credentials")) {
    return { message: "Incorrect email or password.", noAccount: true };
  }
  if (m.includes("invalid email")) {
    return { message: "Please enter a valid email address." };
  }
  if (m.includes("password") && m.includes("least")) {
    return { message: "Password is too weak. Please choose a stronger one." };
  }
  if (m.includes("too many requests") || m.includes("rate limit")) {
    return { message: "Too many attempts. Try again later." };
  }
  if (m.includes("user disabled") || m.includes("banned")) {
    return { message: "This account has been disabled." };
  }
  return { message: "Something went wrong." };
};

// ─── Sign up ───────────────────────────────────────────────────────────────
// Unchanged in shape — still routes through your custom SendGrid/Resend flow.
// NOTE: the underlying /api/auth/sendVerification route needs to be rewritten
// to use Supabase Admin (createUser) instead of Firebase Admin — send me that
// file next.
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
      return {
        success: false,
        unverifiedResent: false,
        message: data.error || "Failed to send verification email.",
        accountExists: res.status === 409,
      };
    }

    return {
      success: !data.unverifiedResent,
      unverifiedResent: (data.unverifiedResent as boolean) ?? false,
      message: `Verification email sent to ${email}. Please check your inbox.`,
      accountExists: false,
      user: null,
      username,
    };
  } catch {
    return {
      success: false,
      unverifiedResent: false,
      message: "Sign up failed. Please try again.",
    };
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
// Session cookie handling is now automatic via middleware (@supabase/ssr) —
// no manual /api/auth/session round-trip needed.
export const login = async (email: string, password: string) => {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const { message, noAccount } = friendlyAuthError(error.message);
      return { success: false, message, noAccount };
    }

    notifyAuthChange();
    return { success: true, message: "Login successful!" };
  } catch {
    return { success: false, message: "Login failed. Please try again." };
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    notifyAuthChange();
    return { success: true, message: "Logged out successfully!" };
  } catch {
    return { success: false, message: "Logout failed. Please try again." };
  }
};

// ─── OAuth (Google / Apple) — redirect flow ────────────────────────────────
// Supabase's default OAuth is a full-page redirect, not a popup. This function
// now navigates away from the page — it does NOT return a user synchronously.
// Your authContext picks up the session automatically via onAuthStateChange
// once the user lands back on your site after the provider redirect.
async function oauthSignIn(provider: "google" | "apple") {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      const { message } = friendlyAuthError(error.message);
      return { success: false, redirect: false, user: null, message };
    }

    // Browser is navigating away now — this return rarely matters,
    // but kept for type compatibility with existing call sites.
    return { success: true, redirect: true, user: null };
  } catch {
    return {
      success: false,
      redirect: false,
      user: null,
      message: "Sign-in failed. Please try again.",
    };
  }
}

export async function signInWithGoogle() {
  return oauthSignIn("google");
}

export async function signInWithApple() {
  return oauthSignIn("apple");
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
  } catch {
    return {
      success: false,
      message: "Failed to send reset email. Please try again.",
    };
  }
}