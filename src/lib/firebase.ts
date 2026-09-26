import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyBqQxaJaOJOQnxgGbHv3VXJO1RFuLoR40A",
  authDomain:        "enterprise-ai-f7fd0.firebaseapp.com",
  projectId:         "enterprise-ai-f7fd0",
  storageBucket:     "enterprise-ai-f7fd0.firebasestorage.app",
  messagingSenderId: "702037327346",
  appId:             "1:702037327346:web:dfe842bf420898e7c67f6b",
  measurementId:     "G-QFY6TYD8CF",
};

// Prevent duplicate initialization in Next.js hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Auth helpers ─────────────────────────────────
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };
