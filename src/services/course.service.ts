// services/course.service.ts
// -------------------------------------------------
// v2: added schedule field (ScheduleItem[]) to Course.
// All Firestore operations for courses live here.
// Components and hooks never import Firebase directly.
// -------------------------------------------------

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course, CreateCoursePayload, ScheduleItem } from "@/types/course";

const COURSES = "courses";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function docToCourse(id: string, data: Record<string, unknown>): Course {
  const rawTs = data.createdAt;
  let createdAt = "";
  if (rawTs instanceof Timestamp) {
    createdAt = rawTs.toDate().toISOString();
  } else if (typeof rawTs === "string") {
    createdAt = rawTs;
  }

  return {
    id,
    name: (data.name as string) ?? "Untitled",
    description: (data.description as string) ?? "",
    teacherId: (data.teacherId as string | null) ?? null,
    teacherName: data.teacherName as string | undefined,
    schedule: (data.schedule as ScheduleItem[]) ?? [],
    createdAt,
  };
}

// ─── createCourse (admin only) ────────────────────────────────────────────────
export async function createCourse(
  payload: CreateCoursePayload,
): Promise<Course> {
  const ref = await addDoc(collection(db, COURSES), {
    name: payload.name.trim(),
    description: payload.description.trim(),
    teacherId: null,
    teacherName: null,
    schedule: [],
    createdAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    name: payload.name.trim(),
    description: payload.description.trim(),
    teacherId: null,
    schedule: [],
    createdAt: new Date().toISOString(),
  };
}

// ─── getCourses (admin only) ──────────────────────────────────────────────────
export async function getCourses(): Promise<Course[]> {
  const q = query(collection(db, COURSES), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToCourse(d.id, d.data() as Record<string, unknown>),
  );
}

// ─── getCoursesByTeacher (teacher only) ───────────────────────────────────────
export async function getCoursesByTeacher(
  teacherId: string,
): Promise<Course[]> {
  const q = query(
    collection(db, COURSES),
    where("teacherId", "==", teacherId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToCourse(d.id, d.data() as Record<string, unknown>),
  );
}

// ─── assignTeacher (admin only) ───────────────────────────────────────────────
export async function assignTeacher(
  courseId: string,
  teacherId: string,
  teacherName: string,
): Promise<void> {
  const ref = doc(db, COURSES, courseId);
  await updateDoc(ref, { teacherId, teacherName });
}

// ─── unassignTeacher (admin only) ─────────────────────────────────────────────
export async function unassignTeacher(courseId: string): Promise<void> {
  const ref = doc(db, COURSES, courseId);
  await updateDoc(ref, { teacherId: null, teacherName: null });
}

// ─── updateSchedule (admin only) ─────────────────────────────────────────────
// Replaces the entire schedule array for a course.
export async function updateSchedule(
  courseId: string,
  schedule: ScheduleItem[],
): Promise<void> {
  const ref = doc(db, COURSES, courseId);
  await updateDoc(ref, { schedule });
}
