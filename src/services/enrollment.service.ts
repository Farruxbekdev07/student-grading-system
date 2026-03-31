// services/enrollment.service.ts
// -------------------------------------------------
// All Firestore operations for enrollments live here.
// No Firebase imports anywhere else in the app for
// enrollment data.
//
// Duplicate prevention strategy:
//   Before addDoc, query for existing (studentId + courseId)
//   pair. If found, throw DuplicateEnrollmentError.
//   Firestore rules enforce *who* can write; this layer
//   enforces *what* is a valid write.
// -------------------------------------------------

import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Enrollment, EnrollPayload } from "@/types/enrollment";

const ENROLLMENTS = "enrollments";

// ─── Typed error for duplicate enrollment ────────────────────────────────────
// Lets the hook surface a specific, user-friendly message
// without string-matching on generic error messages.
export class DuplicateEnrollmentError extends Error {
  constructor(studentName: string, courseName: string) {
    super(`${studentName} is already enrolled in "${courseName}".`);
    this.name = "DuplicateEnrollmentError";
  }
}

// ─── Helper: Firestore doc → typed Enrollment ─────────────────────────────────
function docToEnrollment(id: string, data: Record<string, unknown>): Enrollment {
  const rawTs = data.createdAt;
  let createdAt = "";
  if (rawTs instanceof Timestamp) {
    createdAt = rawTs.toDate().toISOString();
  } else if (typeof rawTs === "string") {
    createdAt = rawTs;
  }

  return {
    id,
    studentId:   (data.studentId   as string) ?? "",
    courseId:    (data.courseId    as string) ?? "",
    studentName: (data.studentName as string) ?? "Unknown student",
    courseName:  (data.courseName  as string) ?? "Unknown course",
    createdAt,
  };
}

// ─── enrollStudent ────────────────────────────────────────────────────────────
// Creates an enrollment after checking for duplicates.
// Caller provides denormalized names — no extra reads needed here.
// Throws DuplicateEnrollmentError if pair already exists.
export async function enrollStudent(payload: EnrollPayload): Promise<Enrollment> {
  const { studentId, courseId, studentName, courseName } = payload;

  // Duplicate check — compound query requires a Firestore composite index on
  // (studentId ASC, courseId ASC). Add to firestore.indexes.json if needed.
  const duplicateCheck = query(
    collection(db, ENROLLMENTS),
    where("studentId", "==", studentId),
    where("courseId",  "==", courseId),
    limit(1)
  );
  const existing = await getDocs(duplicateCheck);
  if (!existing.empty) {
    throw new DuplicateEnrollmentError(studentName, courseName);
  }

  const ref = await addDoc(collection(db, ENROLLMENTS), {
    studentId,
    courseId,
    studentName,
    courseName,
    createdAt: serverTimestamp(),
  });

  return {
    id:  ref.id,
    studentId,
    courseId,
    studentName,
    courseName,
    createdAt: new Date().toISOString(),
  };
}

// ─── getEnrollmentsByStudent ──────────────────────────────────────────────────
// Used by student dashboard — returns only their own enrollments.
// Firestore rule: student can read where studentId == request.auth.uid.
export async function getEnrollmentsByStudent(
  studentId: string
): Promise<Enrollment[]> {
  const q = query(
    collection(db, ENROLLMENTS),
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    docToEnrollment(d.id, d.data() as Record<string, unknown>)
  );
}

// ─── getEnrollmentsByCourse ───────────────────────────────────────────────────
// Used by teacher view — returns students enrolled in a specific course.
// Firestore rule: teacher can read where the course's teacherId == uid.
export async function getEnrollmentsByCourse(
  courseId: string
): Promise<Enrollment[]> {
  const q = query(
    collection(db, ENROLLMENTS),
    where("courseId", "==", courseId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    docToEnrollment(d.id, d.data() as Record<string, unknown>)
  );
}

// ─── getAllEnrollments ────────────────────────────────────────────────────────
// Admin-only full list, ordered newest first.
export async function getAllEnrollments(): Promise<Enrollment[]> {
  const q = query(
    collection(db, ENROLLMENTS),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    docToEnrollment(d.id, d.data() as Record<string, unknown>)
  );
}

// ─── removeEnrollment ────────────────────────────────────────────────────────
// Hard-deletes an enrollment document. Admin only.
export async function removeEnrollment(enrollmentId: string): Promise<void> {
  await deleteDoc(doc(db, ENROLLMENTS, enrollmentId));
}
