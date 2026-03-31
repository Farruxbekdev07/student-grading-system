// hooks/useGrades.ts
// -------------------------------------------------
// v2: lesson-based grading.
//
//   useLessonGrades(lessonId, courseId, lessonTitle)
//     - fetches enrollments for the course to build student roster
//     - merges with existing grades for the specific lesson
//     - tracks dirty rows, bulk-saves with writeBatch
//
//   useStudentGrades(studentId)
//     - read-only, all grades for one student
//
//   useCourseAnalytics(courseId)
//     - read-only, all grades across all lessons in a course
//     - returns raw Grade[] — caller aggregates per lesson or per student
// -------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";
import { Grade, GradeRow, UpsertGradePayload, METRIC_KEYS, GradeMetrics } from "@/types/grade";
import {
  getGradesByLesson,
  getGradesByStudent,
  getGradesByCourse,
  bulkUpsertGrades,
} from "@/services/grade.service";
import { getEnrollmentsByCourse } from "@/services/enrollment.service";

// ─── Utility ──────────────────────────────────────────────────────────────────
function calcOverall(metrics: Pick<GradeRow, keyof GradeMetrics>): number {
  const sum = METRIC_KEYS.reduce((acc, k) => acc + (metrics[k] ?? 0), 0);
  return Math.round((sum / METRIC_KEYS.length) * 10) / 10;
}

function emptyRow(studentId: string, studentName: string): GradeRow {
  return {
    studentId, studentName,
    listening: 0, reading: 0, speaking: 0, writing: 0, interest: 0,
    overall: 0, isDirty: false, isSaving: false,
  };
}

// ─── useLessonGrades ──────────────────────────────────────────────────────────
export interface UseLessonGradesReturn {
  rows:         GradeRow[];
  loading:      boolean;
  saving:       boolean;
  error:        string | null;
  successMsg:   string | null;
  hasDirty:     boolean;
  updateCell:   (studentId: string, field: keyof GradeRow, value: number) => void;
  saveAll:      () => Promise<void>;
  refetch:      () => Promise<void>;
  dismissError: () => void;
}

export function useLessonGrades(
  lessonId:    string,
  courseId:    string,
  lessonTitle: string
): UseLessonGradesReturn {
  const [rows,       setRows]       = useState<GradeRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const dirtyIds = useRef<Set<string>>(new Set());

  const fetchAndMerge = useCallback(async () => {
    if (!lessonId || !courseId) return;
    setLoading(true);
    setError(null);
    dirtyIds.current.clear();
    try {
      const [enrollments, grades] = await Promise.all([
        getEnrollmentsByCourse(courseId),
        getGradesByLesson(lessonId),
      ]);
      const gradeMap = new Map(grades.map((g) => [g.studentId, g]));

      const merged: GradeRow[] = enrollments.map((e) => {
        const g = gradeMap.get(e.studentId);
        if (g) {
          return {
            studentId:   e.studentId,
            studentName: e.studentName,
            ...g.metrics,
            overall:  g.overall,
            isDirty:  false,
            isSaving: false,
          };
        }
        return emptyRow(e.studentId, e.studentName);
      });
      setRows(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load grades.");
    } finally {
      setLoading(false);
    }
  }, [lessonId, courseId]);

  useEffect(() => { fetchAndMerge(); }, [fetchAndMerge]);

  const updateCell = useCallback((
    studentId: string,
    field: keyof GradeRow,
    value: number
  ) => {
    setRows((prev) => prev.map((row) => {
      if (row.studentId !== studentId) return row;
      const updated = { ...row, [field]: value };
      updated.overall = calcOverall(updated);
      updated.isDirty = true;
      dirtyIds.current.add(studentId);
      return updated;
    }));
  }, []);

  const saveAll = useCallback(async () => {
    const changedRows = rows.filter((r) => dirtyIds.current.has(r.studentId));
    if (changedRows.length === 0) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    setRows((prev) =>
      prev.map((r) =>
        dirtyIds.current.has(r.studentId) ? { ...r, isSaving: true } : r
      )
    );

    const payloads: UpsertGradePayload[] = changedRows.map((r) => ({
      studentId:   r.studentId,
      studentName: r.studentName,
      courseId,
      lessonId,
      lessonTitle,
      listening: r.listening,
      reading:   r.reading,
      speaking:  r.speaking,
      writing:   r.writing,
      interest:  r.interest,
    }));

    try {
      await bulkUpsertGrades(payloads);
      dirtyIds.current.clear();
      setRows((prev) =>
        prev.map((r) => ({ ...r, isDirty: false, isSaving: false }))
      );
      setSuccessMsg(
        `${changedRows.length} grade${changedRows.length > 1 ? "s" : ""} saved.`
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save grades.");
      setRows((prev) => prev.map((r) => ({ ...r, isSaving: false })));
    } finally {
      setSaving(false);
    }
  }, [rows, courseId, lessonId, lessonTitle]);

  return {
    rows, loading, saving, error, successMsg,
    hasDirty:     dirtyIds.current.size > 0,
    updateCell,
    saveAll,
    refetch:      fetchAndMerge,
    dismissError: () => setError(null),
  };
}

// ─── useStudentGrades ─────────────────────────────────────────────────────────
export interface UseStudentGradesReturn {
  grades:  Grade[];
  loading: boolean;
  error:   string | null;
  refetch: () => Promise<void>;
}

export function useStudentGrades(studentId: string): UseStudentGradesReturn {
  const [grades,  setGrades]  = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGradesByStudent(studentId);
      setGrades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load grades.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { grades, loading, error, refetch: fetch };
}

// ─── useCourseAnalytics ───────────────────────────────────────────────────────
// Returns all Grade documents for a course (across all lessons).
// The analytics page slices this array by lessonId or aggregates across lessons.
export interface UseCourseAnalyticsReturn {
  grades:  Grade[];
  loading: boolean;
  error:   string | null;
  refetch: () => Promise<void>;
}

export function useCourseAnalytics(courseId: string): UseCourseAnalyticsReturn {
  const [grades,  setGrades]  = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGradesByCourse(courseId);
      setGrades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { grades, loading, error, refetch: fetch };
}
