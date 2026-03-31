// services/user.service.ts
// -------------------------------------------------
// Admin-only Firestore operations for user management.
// Components and hooks never import Firebase directly.
// Firestore security rules enforce admin-only writes
// as the authoritative guard — this is the client layer.
// -------------------------------------------------

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser, UserRole } from "@/types/user";

const VALID_ROLES: UserRole[] = ["admin", "teacher", "student"];

// ─── Fetch all users (admin only) ────────────────────────────────────────────
// Firestore rule ensures only admins can read the full collection.
// We order by name for a stable, predictable table order.
export async function getAllUsers(): Promise<AppUser[]> {
  const q = query(collection(db, "users"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid:       data.uid       ?? docSnap.id,
      name:      data.name      ?? "—",
      email:     data.email     ?? "—",
      role:      data.role      ?? "student",
      createdAt: data.createdAt ?? undefined,
    } satisfies AppUser;
  });
}

// ─── Update a single user's name ─────────────────────────────────────────────
// Callable by:
//   - admin (any user)
//   - the user themselves (own doc only)
// Firestore rule enforces this at the DB level.
// We trim whitespace and reject empty strings client-side.
export async function updateUserName(
  userId: string,
  name:   string
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name cannot be empty.");
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { name: trimmed });
}

// ─── Update a single user's role (admin only) ─────────────────────────────────
// Firestore rule double-checks the caller is an admin server-side.
// We validate the role string here before it reaches Firestore —
// rejects unknown values before they become a bad write.
export async function updateUserRole(
  userId: string,
  role:   UserRole
): Promise<void> {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(", ")}.`);
  }
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { role });
}

