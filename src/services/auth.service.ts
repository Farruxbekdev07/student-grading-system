// services/auth.service.ts
// -------------------------------------------------
// Decision: ALL Firebase Auth + Firestore logic lives
// here. Components and hooks never import firebase
// directly. This makes the service independently
// testable and easy to swap backends later.
// -------------------------------------------------

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase";
import { AppUser, FirestoreUser, UserRole } from "@/types/user";

// ─── Cookie key used by middleware for route protection ───────────────────────
const AUTH_COOKIE = "auth-token";
const COOKIE_EXPIRES = 7; // days

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<AppUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = credential;

  const newUser: FirestoreUser = {
    uid: user.uid,
    email: user.email ?? email,
    name,
    role: "student", // default role
    createdAt: new Date().toISOString(),
  };

  // Write user profile to Firestore
  await setDoc(doc(db, "users", user.uid), {
    ...newUser,
    createdAt: serverTimestamp(), // server-side timestamp in Firestore
  });

  // Set auth cookie for middleware
  const token = await user.getIdToken();
  Cookies.set(AUTH_COOKIE, token, { expires: COOKIE_EXPIRES, secure: true });

  return newUser;
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(
  email: string,
  password: string
): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const { user } = credential;

  const appUser = await fetchUserProfile(user.uid);
  if (!appUser) throw new Error("User profile not found. Please contact support.");

  const token = await user.getIdToken();
  Cookies.set(AUTH_COOKIE, token, { expires: COOKIE_EXPIRES, secure: true });

  return appUser;
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await signOut(auth);
  Cookies.remove(AUTH_COOKIE);
}

// ─── Fetch user profile from Firestore ───────────────────────────────────────
export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  const data = snap.data() as FirestoreUser;
  return {
    uid: data.uid,
    email: data.email,
    name: data.name,
    role: data.role,
    createdAt: data.createdAt,
  };
}

// ─── Auth state observer ──────────────────────────────────────────────────────
// Used by the root Providers to rehydrate auth state on page refresh.
// Returns an unsubscribe function.
export function observeAuthState(
  callback: (user: AppUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      Cookies.remove(AUTH_COOKIE);
      callback(null);
      return;
    }
    // Refresh cookie on each page load
    const token = await firebaseUser.getIdToken();
    Cookies.set(AUTH_COOKIE, token, { expires: COOKIE_EXPIRES, secure: true });

    const profile = await fetchUserProfile(firebaseUser.uid);
    callback(profile);
  });
}

// ─── Role-based redirect helper ───────────────────────────────────────────────
export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    admin:   "/admin",
    teacher: "/teacher",
    student: "/student",
  };
  return paths[role] ?? "/student";
}
