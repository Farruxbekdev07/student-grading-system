// types/lesson.ts

import { Timestamp } from "firebase/firestore";

export interface Lesson {
  id:        string;
  courseId:  string;
  title:     string;
  date:      string; // ISO string — safe for Redux / serialization
  createdAt: string;
}

// Payload for createLesson — id and timestamps are server-generated
export type CreateLessonPayload = Pick<Lesson, "courseId" | "title" | "date">;
