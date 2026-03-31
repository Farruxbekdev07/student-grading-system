// hooks/useEnrollments.ts
// -------------------------------------------------
// Three hooks, one per access pattern:
//
//   useAdminEnrollments()     — full CRUD, admin only
//   useStudentEnrollments()   — read-only, own data
//   useCourseStudents()       — read-only, teacher view
//
// Pattern is identical to useCourses.ts:
//   - Local useState/useEffect (not Redux — server state)
//   - Service calls only, no Firebase imports here
//   - Optimistic updates with typed rollback in admin hook
// -------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import { Enrollment, EnrollPayload } from "@/types/enrollment";
import {
  enrollStudent,
  getEnrollmentsByStudent,
  getEnrollmentsByCourse,
  getAllEnrollments,
  removeEnrollment,
  DuplicateEnrollmentError,
} from "@/services/enrollment.service";

// ─── useAdminEnrollments ──────────────────────────────────────────────────────
export interface UseAdminEnrollmentsReturn {
  enrollments:  Enrollment[];
  loading:      boolean;
  error:        string | null;
  enrolling:    boolean;           // true while enrollStudent is in-flight
  removingId:   string | null;     // enrollmentId currently being removed
  enroll:       (payload: EnrollPayload) => Promise<Enrollment | null>;
  remove:       (enrollmentId: string) => Promise<void>;
  refetch:      () => Promise<void>;
}

export function useAdminEnrollments(): UseAdminEnrollmentsReturn {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [enrolling,   setEnrolling]   = useState(false);
  const [removingId,  setRemovingId]  = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllEnrollments();
      setEnrollments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enrollments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Enroll — prepend on success, surface typed duplicate error
  const enroll = useCallback(async (
    payload: EnrollPayload
  ): Promise<Enrollment | null> => {
    setEnrolling(true);
    setError(null);
    try {
      const created = await enrollStudent(payload);
      setEnrollments((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      // DuplicateEnrollmentError has a user-friendly message — surface it directly
      setError(err instanceof Error ? err.message : "Enrollment failed.");
      return null;
    } finally {
      setEnrolling(false);
    }
  }, []);

  // Optimistic remove — remove row immediately, restore on failure
  const remove = useCallback(async (enrollmentId: string): Promise<void> => {
    const previous = enrollments.find((e) => e.id === enrollmentId);
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    setRemovingId(enrollmentId);
    try {
      await removeEnrollment(enrollmentId);
    } catch (err) {
      // Rollback: restore removed row at its original position
      if (previous) {
        setEnrollments((prev) => [previous, ...prev]);
      }
      setError(err instanceof Error ? err.message : "Failed to remove enrollment.");
    } finally {
      setRemovingId(null);
    }
  }, [enrollments]);

  return {
    enrollments, loading, error,
    enrolling, removingId,
    enroll, remove,
    refetch: fetchAll,
  };
}

// ─── useStudentEnrollments ────────────────────────────────────────────────────
// Read-only. studentId comes from authSlice in the calling component.
export interface UseStudentEnrollmentsReturn {
  enrollments: Enrollment[];
  loading:     boolean;
  error:       string | null;
  refetch:     () => Promise<void>;
}

export function useStudentEnrollments(
  studentId: string
): UseStudentEnrollmentsReturn {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const fetchOwn = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEnrollmentsByStudent(studentId);
      setEnrollments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your courses.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchOwn(); }, [fetchOwn]);

  return { enrollments, loading, error, refetch: fetchOwn };
}

// ─── useCourseStudents ────────────────────────────────────────────────────────
// Read-only. For teacher view — lists students in a specific course.
// courseId comes from route params in the calling component.
export interface UseCourseStudentsReturn {
  enrollments: Enrollment[];
  loading:     boolean;
  error:       string | null;
  refetch:     () => Promise<void>;
}

export function useCourseStudents(courseId: string): UseCourseStudentsReturn {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEnrollmentsByCourse(courseId);
      setEnrollments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  return { enrollments, loading, error, refetch: fetchCourse };
}
