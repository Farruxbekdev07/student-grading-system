// types/enrollment.ts

export interface Enrollment {
  id:          string;
  studentId:   string;
  courseId:    string;
  studentName: string;  // denormalized from users/{studentId}.name
  courseName:  string;  // denormalized from courses/{courseId}.name
  createdAt:   string;  // ISO string — safe for Redux / serialization
}

// Payload for enrollStudent() — caller supplies denormalized names
// so the service doesn't need extra reads to build the document
export interface EnrollPayload {
  studentId:   string;
  courseId:    string;
  studentName: string;
  courseName:  string;
}
