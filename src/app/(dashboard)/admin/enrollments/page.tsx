"use client";
// app/(dashboard)/admin/enrollments/page.tsx
// -------------------------------------------------
// Admin-only. Two-panel layout:
//   Top:    Enroll form (student select + course select)
//   Bottom: Full enrollment list with remove action
//
// Data sources:
//   Students list  → useUsers()  (already exists, filter role==="student")
//   Courses list   → useAdminCourses() (already exists)
//   Enrollments    → useAdminEnrollments() (new)
//
// All mutations go through the hook → service → Firestore.
// Zero Firebase usage in this file.
// -------------------------------------------------

import React, { useState, useMemo } from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { RouteGuard } from "@/components/RouteGuard";
import { useAdminEnrollments } from "@/hooks/useEnrollments";
import { useUsers } from "@/hooks/useUsers";
import { useAdminCourses } from "@/hooks/useCourses";

// ─── Enroll form ──────────────────────────────────────────────────────────────
function EnrollForm({
  students,
  courses,
  enrolling,
  onSubmit,
}: {
  students:  { uid: string; name: string }[];
  courses:   { id: string; name: string }[];
  enrolling: boolean;
  onSubmit:  (studentId: string, courseId: string) => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [courseId,  setCourseId]  = useState("");

  const canSubmit = studentId && courseId && !enrolling;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(studentId, courseId);
    // Don't clear — admin likely wants to enroll multiple students in same course
    setStudentId("");
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <PersonAddIcon color="primary" fontSize="small" />
          <Typography variant="h6" fontWeight={600}>Enroll a Student</Typography>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <FormControl size="small" sx={{ minWidth: 220 }} required>
              <InputLabel>Student</InputLabel>
              <Select
                value={studentId}
                label="Student"
                onChange={(e: SelectChangeEvent) => setStudentId(e.target.value)}
              >
                {students.length === 0 && (
                  <MenuItem disabled value="">
                    <em>No students registered</em>
                  </MenuItem>
                )}
                {students.map((s) => (
                  <MenuItem key={s.uid} value={s.uid}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }} required>
              <InputLabel>Course</InputLabel>
              <Select
                value={courseId}
                label="Course"
                onChange={(e: SelectChangeEvent) => setCourseId(e.target.value)}
              >
                {courses.length === 0 && (
                  <MenuItem disabled value="">
                    <em>No courses available</em>
                  </MenuItem>
                )}
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit}
              startIcon={
                enrolling
                  ? <CircularProgress size={14} color="inherit" />
                  : <PersonAddIcon />
              }
              sx={{ height: 40, whiteSpace: "nowrap" }}
            >
              {enrolling ? "Enrolling…" : "Enroll"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Enrollment table row ─────────────────────────────────────────────────────
function EnrollmentRow({
  studentName,
  courseName,
  createdAt,
  isRemoving,
  onRemove,
}: {
  studentName: string;
  courseName:  string;
  createdAt:   string;
  isRemoving:  boolean;
  onRemove:    () => void;
}) {
  const date = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric",
      })
    : "—";

  return (
    <TableRow
      hover
      sx={{ opacity: isRemoving ? 0.4 : 1, transition: "opacity 0.2s" }}
    >
      <TableCell>
        <Typography variant="body2" fontWeight={500}>{studentName}</Typography>
      </TableCell>
      <TableCell>
        <Chip label={courseName} size="small" color="secondary" variant="outlined" />
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary">{date}</Typography>
      </TableCell>
      <TableCell align="right">
        {isRemoving ? (
          <CircularProgress size={18} />
        ) : (
          <Tooltip title="Remove enrollment">
            <IconButton size="small" color="error" onClick={onRemove}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
function AdminEnrollmentsPanel() {
  const {
    enrollments, loading, error,
    enrolling, removingId,
    enroll, remove, refetch,
  } = useAdminEnrollments();

  // Reuse existing hooks — zero new fetching logic
  const { users,    loading: usersLoading    } = useUsers();
  const { courses,  loading: coursesLoading  } = useAdminCourses();

  const students = useMemo(
    () => users.filter((u) => u.role === "student"),
    [users]
  );

  const [toast, setToast] = useState<string | null>(null);

  const handleEnroll = async (studentId: string, courseId: string) => {
    const student = students.find((s) => s.uid === studentId);
    const course  = courses.find((c)  => c.id  === courseId);
    if (!student || !course) return;

    const result = await enroll({
      studentId,
      courseId,
      studentName: student.name,
      courseName:  course.name,
    });
    if (result) setToast(`${student.name} enrolled in "${course.name}".`);
  };

  const handleRemove = async (enrollmentId: string) => {
    await remove(enrollmentId);
    setToast("Enrollment removed.");
  };

  const isDataLoading = loading || usersLoading || coursesLoading;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <HowToRegIcon color="primary" />
          <div>
            <Typography variant="h5" fontWeight={700}>Enrollment Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Assign students to courses.
            </Typography>
          </div>
        </div>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={refetch} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      {/* Summary */}
      {!isDataLoading && (
        <div className="flex gap-3 flex-wrap">
          <Chip label={`${enrollments.length} total enrollments`} size="small" variant="outlined" />
          <Chip label={`${students.length} students`} size="small" color="primary" variant="outlined" />
          <Chip label={`${courses.length} courses`} size="small" color="secondary" variant="outlined" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert
          severity={error.includes("already enrolled") ? "warning" : "error"}
          onClose={() => {}}
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Enroll form */}
      <EnrollForm
        students={students}
        courses={courses}
        enrolling={enrolling}
        onSubmit={handleEnroll}
      />

      <Divider />

      {/* Enrollment list */}
      <Typography variant="h6" fontWeight={600}>All Enrollments</Typography>

      {loading ? (
        <Box className="flex justify-center py-10">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12 } }}>
                <TableCell>Student</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Enrolled On</TableCell>
                <TableCell align="right">Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No enrollments yet. Use the form above to enroll a student.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((e) => (
                  <EnrollmentRow
                    key={e.id}
                    studentName={e.studentName}
                    courseName={e.courseName}
                    createdAt={e.createdAt}
                    isRemoving={removingId === e.id}
                    onRemove={() => handleRemove(e.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Toast */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default function AdminEnrollmentsPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminEnrollmentsPanel />
    </RouteGuard>
  );
}
