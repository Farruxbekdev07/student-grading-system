// hooks/useCourses.ts
// -------------------------------------------------
// Follows the exact same pattern as useUsers.ts:
//   - Local useState/useEffect (not Redux)
//   - Service layer calls only — no Firebase here
//   - Optimistic updates with rollback on failure
//   - Separate loading states for fetch vs mutation
// -------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import { Course, CreateCoursePayload } from "@/types/course";
import {
  getCourses,
  getCoursesByTeacher,
  createCourse,
  assignTeacher,
  unassignTeacher,
} from "@/services/course.service";

// ─── Shared state shape ───────────────────────────────────────────────────────
interface BaseState {
  courses:    Course[];
  loading:    boolean;
  error:      string | null;
  refetch:    () => Promise<void>;
}

// ─── Admin hook — full course list + mutations ────────────────────────────────
interface UseAdminCoursesReturn extends BaseState {
  mutatingId:   string | null;   // courseId currently being updated
  creating:     boolean;          // true while createCourse is in flight
  addCourse:    (payload: CreateCoursePayload) => Promise<Course | null>;
  assignTo:     (courseId: string, teacherId: string, teacherName: string) => Promise<void>;
  unassignFrom: (courseId: string) => Promise<void>;
}

export function useAdminCourses(): UseAdminCoursesReturn {
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [creating,   setCreating]   = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Create course — prepend to list on success
  const addCourse = useCallback(async (
    payload: CreateCoursePayload
  ): Promise<Course | null> => {
    setCreating(true);
    setError(null);
    try {
      const created = await createCourse(payload);
      setCourses((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course.");
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  // Optimistic assign — update local state immediately, rollback on failure
  const assignTo = useCallback(async (
    courseId:    string,
    teacherId:   string,
    teacherName: string
  ): Promise<void> => {
    const previous = courses.find((c) => c.id === courseId);
    setCourses((prev) =>
      prev.map((c) => c.id === courseId ? { ...c, teacherId, teacherName } : c)
    );
    setMutatingId(courseId);
    try {
      await assignTeacher(courseId, teacherId, teacherName);
    } catch (err) {
      // Rollback
      if (previous) {
        setCourses((prev) =>
          prev.map((c) => c.id === courseId ? previous : c)
        );
      }
      setError(err instanceof Error ? err.message : "Failed to assign teacher.");
    } finally {
      setMutatingId(null);
    }
  }, [courses]);

  // Optimistic unassign
  const unassignFrom = useCallback(async (courseId: string): Promise<void> => {
    const previous = courses.find((c) => c.id === courseId);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, teacherId: null, teacherName: undefined }
          : c
      )
    );
    setMutatingId(courseId);
    try {
      await unassignTeacher(courseId);
    } catch (err) {
      if (previous) {
        setCourses((prev) =>
          prev.map((c) => c.id === courseId ? previous : c)
        );
      }
      setError(err instanceof Error ? err.message : "Failed to unassign teacher.");
    } finally {
      setMutatingId(null);
    }
  }, [courses]);

  return {
    courses, loading, error,
    mutatingId, creating,
    addCourse, assignTo, unassignFrom,
    refetch: fetchAll,
  };
}

// ─── Teacher hook — own courses only, read-only ───────────────────────────────
interface UseTeacherCoursesReturn extends BaseState {}

export function useTeacherCourses(teacherId: string): UseTeacherCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchOwn = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCoursesByTeacher(teacherId);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { fetchOwn(); }, [fetchOwn]);

  return { courses, loading, error, refetch: fetchOwn };
}
