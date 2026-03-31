// types/grade.ts
// -------------------------------------------------
// v2: lesson-based grading.
// Grade document ID: `${studentId}_${lessonId}`
// Removed teacherId (derived from course) and courseName
// (not needed at grade level — use lessonTitle + courseId).
// -------------------------------------------------

export interface GradeMetrics {
  listening: number;
  reading:   number;
  speaking:  number;
  writing:   number;
  interest:  number;
}

export interface Grade {
  id:          string;          // `${studentId}_${lessonId}`
  studentId:   string;
  studentName: string;          // denormalized
  courseId:    string;
  lessonId:    string;          // replaces course-level scope
  lessonTitle: string;          // denormalized
  metrics:     GradeMetrics;
  overall:     number;          // auto-calculated avg of 5 metrics
  createdAt:   string;          // ISO string
  updatedAt:   string;          // ISO string
}

// Shape used when upserting — id and timestamps are server-derived
export type UpsertGradePayload = GradeMetrics & {
  studentId:   string;
  studentName: string;
  courseId:    string;
  lessonId:    string;
  lessonTitle: string;
};

// Row in the editable grading table — client-only fields never persisted
export interface GradeRow extends GradeMetrics {
  studentId:   string;
  studentName: string;
  overall:     number;
  isDirty:     boolean;
  isSaving:    boolean;
}

// Keys of the 5 editable metrics — drives table columns + radar chart
export const METRIC_KEYS: (keyof GradeMetrics)[] = [
  "listening",
  "reading",
  "speaking",
  "writing",
  "interest",
];

// Radar chart data point shape required by Recharts
export interface RadarDataPoint {
  metric: string;
  value:  number;
  full:   100;
}
