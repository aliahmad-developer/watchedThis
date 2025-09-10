import { auth, db } from "../../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // ✅ add this

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

    // Save user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: username,
      createdAt: serverTimestamp(),
    });

    // Set displayName immediately
    await updateProfile(user, { displayName: username });
    await user.getIdToken(true);

    // Send verification email
    await sendEmailVerification(user);

    return {
      success: true,
      message: `Signup successful! A verification email has been sent to ${email}.`,
      user,
      username,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export const login = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true, message: "Login successful!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true, message: "Logged out successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
