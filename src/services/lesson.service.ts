// services/lesson.service.ts
// -------------------------------------------------
// All Firestore operations for lessons live here.
// Lessons belong to a course and are created by the
// teacher assigned to that course.
// Firestore rules enforce: teacher can only create
// lessons for courses where teacherId == auth.uid.
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lesson, CreateLessonPayload } from "@/types/lesson";

const LESSONS = "lessons";

// ─── Helper ───────────────────────────────────────────────────────────────────
function docToLesson(id: string, data: Record<string, unknown>): Lesson {
  const toIso = (v: unknown): string => {
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (typeof v === "string")  return v;
    return new Date().toISOString();
  };

  return {
    id,
    courseId:  (data.courseId  as string) ?? "",
    title:     (data.title     as string) ?? "Untitled lesson",
    date:      toIso(data.date),
    createdAt: toIso(data.createdAt),
  };
}

// ─── createLesson ─────────────────────────────────────────────────────────────
// Teacher creates a lesson inside their course.
export async function createLesson(payload: CreateLessonPayload): Promise<Lesson> {
  const ref = await addDoc(collection(db, LESSONS), {
    courseId:  payload.courseId,
    title:     payload.title.trim(),
    date:      new Date(payload.date),
    createdAt: serverTimestamp(),
  });

  return {
    id:        ref.id,
    courseId:  payload.courseId,
    title:     payload.title.trim(),
    date:      payload.date,
    createdAt: new Date().toISOString(),
  };
}

// ─── getLessonsByCourse ───────────────────────────────────────────────────────
// Returns all lessons for a course, newest first.
// Used by teacher lesson list and student lesson view.
export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const q = query(
    collection(db, LESSONS),
    where("courseId", "==", courseId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    docToLesson(d.id, d.data() as Record<string, unknown>)
  );
}

// ─── deleteLesson ─────────────────────────────────────────────────────────────
// Hard-deletes a lesson. Orphaned grade documents are left in place
// (they retain lessonId for audit purposes — admin can clean up later).
export async function deleteLesson(lessonId: string): Promise<void> {
  await deleteDoc(doc(db, LESSONS, lessonId));
}
