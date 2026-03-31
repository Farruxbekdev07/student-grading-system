// services/grade.service.ts
// -------------------------------------------------
// v2: lesson-based grading.
//
// Document ID: `${studentId}_${lessonId}`
//   - deterministic upsert via set({ merge: true })
//   - lessonId is globally unique so no cross-course collisions
//   - overall is always server-calculated, never from user input
//
// Removed: getGradesByCourse (replaced by getGradesByLesson)
// Added:   getGradesByLesson, getGradesByStudentAndCourse
// -------------------------------------------------

import {
  doc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Grade,
  GradeMetrics,
  UpsertGradePayload,
  METRIC_KEYS,
} from "@/types/grade";

const GRADES = "grades";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcOverall(metrics: GradeMetrics): number {
  const sum = METRIC_KEYS.reduce((acc, k) => acc + metrics[k], 0);
  return Math.round((sum / METRIC_KEYS.length) * 10) / 10;
}

function gradeDocId(studentId: string, lessonId: string): string {
  return `${studentId}_${lessonId}`;
}

function docToGrade(id: string, data: Record<string, unknown>): Grade {
  const toIso = (v: unknown): string => {
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (typeof v === "string") return v;
    return new Date().toISOString();
  };

  // Support both flat (legacy) and nested metrics shape
  const raw = (data.metrics as Record<string, number> | undefined) ?? data;

  const metrics: GradeMetrics = {
    listening: Number(raw.listening) || 0,
    reading: Number(raw.reading) || 0,
    speaking: Number(raw.speaking) || 0,
    writing: Number(raw.writing) || 0,
    interest: Number(raw.interest) || 0,
  };

  return {
    id,
    studentId: (data.studentId as string) ?? "",
    studentName: (data.studentName as string) ?? "",
    courseId: (data.courseId as string) ?? "",
    lessonId: (data.lessonId as string) ?? "",
    lessonTitle: (data.lessonTitle as string) ?? "",
    metrics,
    overall: Number(data.overall) || calcOverall(metrics),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

// ─── bulkUpsertGrades ─────────────────────────────────────────────────────────
// Atomically writes all changed rows using writeBatch.
// Chunked to respect Firestore's 500-operation limit.
export async function bulkUpsertGrades(
  payloads: UpsertGradePayload[],
): Promise<void> {
  if (payloads.length === 0) return;

  const CHUNK = 500;
  for (let i = 0; i < payloads.length; i += CHUNK) {
    const chunk = payloads.slice(i, i + CHUNK);
    const batch = writeBatch(db);

    chunk.forEach((payload) => {
      const { studentId, lessonId } = payload;
      const metrics: GradeMetrics = {
        listening: payload.listening,
        reading: payload.reading,
        speaking: payload.speaking,
        writing: payload.writing,
        interest: payload.interest,
      };
      const overall = calcOverall(metrics);
      const docId = gradeDocId(studentId, lessonId);
      const ref = doc(db, GRADES, docId);

      console.log("payload:", payload);

      batch.set(
        ref,
        {
          studentId: payload.studentId,
          studentName: payload.studentName,
          courseId: payload.courseId,
          lessonId: payload.lessonId,
          lessonTitle: payload.lessonTitle,
          metrics,
          overall,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    await batch.commit();
  }
}

// ─── getGradesByLesson ────────────────────────────────────────────────────────
// Primary teacher query — all grades for one lesson, ordered alpha by name.
export async function getGradesByLesson(lessonId: string): Promise<Grade[]> {
  const q = query(
    collection(db, GRADES),
    where("lessonId", "==", lessonId),
    orderBy("studentName", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    docToGrade(d.id, d.data() as Record<string, unknown>),
  );
}

// ─── getGradesByCourse ────────────────────────────────────────────────────────
// Analytics query — all grades across all lessons in a course.
// Used to build per-student aggregates for "All lessons" view.
export async function getGradesByCourse(courseId: string): Promise<Grade[]> {
  const q = query(
    collection(db, GRADES),
    where("courseId", "==", courseId),
    orderBy("studentName", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    docToGrade(d.id, d.data() as Record<string, unknown>),
  );
}

// ─── getGradesByStudent ───────────────────────────────────────────────────────
// Student view — all grades for one student across all lessons/courses.
export async function getGradesByStudent(studentId: string): Promise<Grade[]> {
  const q = query(
    collection(db, GRADES),
    where("studentId", "==", studentId),
    orderBy("lessonTitle", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    docToGrade(d.id, d.data() as Record<string, unknown>),
  );
}
