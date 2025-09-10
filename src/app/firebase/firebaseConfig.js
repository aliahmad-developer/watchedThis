import { initializeApp } from "firebase/app";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAGI1_aNBvq3k3bkNw4YBFQmSIeiYQT7pE",
  authDomain: "fyp-movie-4d46d.firebaseapp.com",
  projectId: "fyp-movie-4d46d",
  storageBucket: "fyp-movie-4d46d.firebasestorage.app",
  messagingSenderId: "533039372071",
  appId: "1:533039372071:web:8e51125262c4e74ecffb02",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { sendEmailVerification };
