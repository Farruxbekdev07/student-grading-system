"use client";
// app/(dashboard)/teacher/lessons/page.tsx
// Global lessons list for the sidebar "Lessons" link.
// Filter by course via dropdown. "Open Grades" action per row.

import React, { useState, useMemo } from "react";
import Typography    from "@mui/material/Typography";
import Table         from "@mui/material/Table";
import TableBody     from "@mui/material/TableBody";
import TableCell     from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead     from "@mui/material/TableHead";
import TableRow      from "@mui/material/TableRow";
import Paper         from "@mui/material/Paper";
import FormControl   from "@mui/material/FormControl";
import InputLabel    from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem      from "@mui/material/MenuItem";
import Button        from "@mui/material/Button";
import Chip          from "@mui/material/Chip";
import Alert         from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box           from "@mui/material/Box";
import MenuBookIcon  from "@mui/icons-material/MenuBook";
import GradingIcon   from "@mui/icons-material/Grading";
import { useRouter } from "next/navigation";
import { RouteGuard }         from "@/components/RouteGuard";
import { PageHeader }         from "@/components/layout/PageHeader";
import { EmptyState }         from "@/components/ui/EmptyState";
import { useTeacherCourses }  from "@/hooks/useCourses";
import { useTeacherLessons }  from "@/hooks/useLessons";
import { useAppSelector }     from "@/store";
import { selectUser }         from "@/store/slices/authSlice";

// ─── Inner panel — needs courseId to fetch lessons ────────────────────────────
function LessonsForCourse({ courseId, courseName }: { courseId: string; courseName: string }) {
  const router = useRouter();
  const { lessons, loading, error } = useTeacherLessons(courseId);

  if (loading) return <Box className="flex justify-center py-8"><CircularProgress size={28} /></Box>;
  if (error)   return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (lessons.length === 0) return (
    <EmptyState
      icon={<MenuBookIcon />}
      title="No lessons yet for this course."
      subtitle="Go to the course's lessons page to create one."
    />
  );

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12 } }}>
            <TableCell>Lesson title</TableCell>
            <TableCell>Course</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lessons.map((lesson) => (
            <TableRow key={lesson.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>{lesson.title}</Typography>
              </TableCell>
              <TableCell>
                <Chip label={courseName} size="small" color="secondary" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {new Date(lesson.date).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<GradingIcon fontSize="small" />}
                  onClick={() =>
                    router.push(`/teacher/course/${courseId}/lesson/${lesson.id}/grades`)
                  }
                >
                  Open Grades
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function TeacherLessonsPanel() {
  const user = useAppSelector(selectUser);
  const { courses, loading: coursesLoading } = useTeacherCourses(user?.uid ?? "");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lessons"
        subtitle="Select a course to view and manage its lessons."
        icon={<MenuBookIcon />}
      />

      {/* Course filter */}
      <FormControl size="small" sx={{ maxWidth: 320 }} disabled={coursesLoading}>
        <InputLabel>Filter by course</InputLabel>
        <Select
          value={selectedCourseId}
          label="Filter by course"
          onChange={(e: SelectChangeEvent) => setSelectedCourseId(e.target.value)}
        >
          <MenuItem value="" disabled><em>Select a course…</em></MenuItem>
          {courses.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Lesson table — only shown when course is selected */}
      {!selectedCourseId ? (
        <EmptyState
          icon={<MenuBookIcon />}
          title="No course selected."
          subtitle="Use the dropdown above to choose a course."
        />
      ) : (
        <LessonsForCourse courseId={selectedCourseId} courseName={selectedCourse?.name ?? ""} />
      )}
    </div>
  );
}

export default function TeacherLessonsPage() {
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <TeacherLessonsPanel />
    </RouteGuard>
  );
}
