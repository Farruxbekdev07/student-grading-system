// hooks/useLessons.ts
// -------------------------------------------------
// Two hooks, split by role:
//
//   useTeacherLessons(courseId)
//     - fetch + create + delete for teacher
//     - optimistic prepend on create
//
//   useStudentLessons(courseIds)
//     - read-only, fetches lessons for all enrolled courses
//     - used by /student/lessons page
// -------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import { Lesson, CreateLessonPayload } from "@/types/lesson";
import {
  getLessonsByCourse,
  createLesson,
  deleteLesson,
} from "@/services/lesson.service";

// ─── useTeacherLessons ────────────────────────────────────────────────────────
export interface UseTeacherLessonsReturn {
  lessons:    Lesson[];
  loading:    boolean;
  error:      string | null;
  creating:   boolean;
  addLesson:  (payload: CreateLessonPayload) => Promise<Lesson | null>;
  removeLesson: (lessonId: string) => Promise<void>;
  refetch:    () => Promise<void>;
}

export function useTeacherLessons(courseId: string): UseTeacherLessonsReturn {
  const [lessons,  setLessons]  = useState<Lesson[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetch = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLessonsByCourse(courseId);
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lessons.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addLesson = useCallback(async (
    payload: CreateLessonPayload
  ): Promise<Lesson | null> => {
    setCreating(true);
    setError(null);
    try {
      const created = await createLesson(payload);
      // Prepend — lessons are ordered newest first
      setLessons((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lesson.");
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  // Optimistic remove — restore on failure
  const removeLesson = useCallback(async (lessonId: string): Promise<void> => {
    const previous = lessons.find((l) => l.id === lessonId);
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    try {
      await deleteLesson(lessonId);
    } catch (err) {
      if (previous) setLessons((prev) => [previous, ...prev]);
      setError(err instanceof Error ? err.message : "Failed to delete lesson.");
    }
  }, [lessons]);

  return { lessons, loading, error, creating, addLesson, removeLesson, refetch: fetch };
}

// ─── useStudentLessons ────────────────────────────────────────────────────────
// Fetches lessons for multiple courseIds (student's enrolled courses).
// Returns a flat list sorted by date descending.
export interface UseStudentLessonsReturn {
  lessons: Lesson[];
  loading: boolean;
  error:   string | null;
  refetch: () => Promise<void>;
}

export function useStudentLessons(courseIds: string[]): UseStudentLessonsReturn {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Stable key to avoid re-fetching when reference changes but content is same
  const courseKey = courseIds.slice().sort().join(",");

  const fetch = useCallback(async () => {
    if (courseIds.length === 0) { setLessons([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        courseIds.map((cid) => getLessonsByCourse(cid))
      );
      const flat = results
        .flat()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLessons(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lessons.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseKey]);

  useEffect(() => { fetch(); }, [fetch]);

  return { lessons, loading, error, refetch: fetch };
}
