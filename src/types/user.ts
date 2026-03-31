// types/user.ts

export type UserRole = "admin" | "teacher" | "student";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string; // ISO string — safe for Redux serialization
}

// What we store in Firestore (same shape, but timestamps can differ)
export interface FirestoreUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}
