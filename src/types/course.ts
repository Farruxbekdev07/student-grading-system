// types/course.ts

export type WeekDay =
  | "monday" | "tuesday" | "wednesday"
  | "thursday" | "friday" | "saturday" | "sunday";

export interface ScheduleItem {
  day:       WeekDay;
  startTime: string; // "HH:MM" 24-hour format
  endTime:   string; // "HH:MM" 24-hour format
}

export interface Course {
  id:           string;
  name:         string;
  description:  string;
  teacherId:    string | null;  // null = unassigned
  teacherName?: string;         // denormalized for display — populated on read
  schedule:     ScheduleItem[]; // weekly recurring schedule
  createdAt:    string;         // ISO string — safe for Redux / serialization
}

// Shape used when creating a new course (id + createdAt are server-generated)
export type CreateCoursePayload = Pick<Course, "name" | "description">;

// Shape used when assigning a teacher
export interface AssignTeacherPayload {
  courseId:  string;
  teacherId: string;
}
