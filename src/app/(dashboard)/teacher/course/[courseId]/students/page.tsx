"use client";
// app/(dashboard)/teacher/course/[courseId]/students/page.tsx
// Main entry after clicking a course card.
// Shows enrolled students + "Go to Grades" button top-right.

import React, { use } from "react";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupIcon from "@mui/icons-material/Group";
import GradingIcon from "@mui/icons-material/Grading";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCourseStudents } from "@/hooks/useEnrollments";

function StudentsPanel({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { enrollments, loading, error, refetch } = useCourseStudents(courseId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enrolled Students"
        subtitle={`${enrollments.length} student${enrollments.length !== 1 ? "s" : ""} in this course`}
        icon={<GroupIcon />}
        backHref="/teacher/courses"
        backLabel="Back to courses"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<MenuBookIcon />}
              onClick={() => router.push(`/teacher/course/${courseId}/lessons`)}
            >
              Lessons
            </Button>
            <Button
              variant="contained"
              startIcon={<GradingIcon />}
              onClick={() => router.push(`/teacher/course/${courseId}/grades`)}
            >
              Go to Grades
            </Button>
          </div>
        }
      />

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box className="flex justify-center py-16">
          <CircularProgress />
        </Box>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={<GroupIcon />}
          title="No students enrolled yet."
          subtitle="An administrator will enroll students in this course."
        />
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12 } }}>
                <TableCell>#</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Enrolled On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.map((e, i) => (
                <TableRow key={e.id} hover>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {i + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {e.studentName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {e.createdAt
                        ? new Date(e.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default function StudentsPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <StudentsPanel courseId={courseId} />
    </RouteGuard>
  );
}
