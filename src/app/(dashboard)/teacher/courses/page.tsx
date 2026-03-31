"use client";
// app/(dashboard)/teacher/courses/page.tsx
// v2: Cards are pure navigation — clicking goes to /students page.
// All action chips removed. Clean card grid.

import React from "react";
import Typography  from "@mui/material/Typography";
import Card        from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid        from "@mui/material/Grid";
import Chip        from "@mui/material/Chip";
import Alert       from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton  from "@mui/material/IconButton";
import Tooltip     from "@mui/material/Tooltip";
import Box         from "@mui/material/Box";
import RefreshIcon         from "@mui/icons-material/Refresh";
import SchoolIcon          from "@mui/icons-material/School";
import CalendarTodayIcon   from "@mui/icons-material/CalendarToday";
import ChevronRightIcon    from "@mui/icons-material/ChevronRight";
import { useRouter }       from "next/navigation";
import { RouteGuard }      from "@/components/RouteGuard";
import { PageHeader }      from "@/components/layout/PageHeader";
import { EmptyState }      from "@/components/ui/EmptyState";
import { useTeacherCourses } from "@/hooks/useCourses";
import { useAppSelector }  from "@/store";
import { selectUser }      from "@/store/slices/authSlice";
import { Course }          from "@/types/course";

// ─── Course card — pure navigation, no action chips ───────────────────────────
function CourseCard({ course }: { course: Course }) {
  const router = useRouter();

  const date = course.createdAt
    ? new Date(course.createdAt).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric",
      })
    : "—";

  const scheduleLabel = course.schedule?.length
    ? course.schedule.map((s) =>
        `${s.day.slice(0, 3).toUpperCase()} ${s.startTime}–${s.endTime}`
      ).join("  ·  ")
    : null;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
      <CardActionArea
        onClick={() => router.push(`/teacher/course/${course.id}/students`)}
        sx={{ height: "100%" }}
      >
        <CardContent className="p-5 flex flex-col gap-3 h-full">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <Typography variant="h6" fontWeight={600} className="leading-snug flex-1">
              {course.name}
            </Typography>
            <ChevronRightIcon color="action" fontSize="small" />
          </div>

          {/* Description */}
          {course.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {course.description}
            </Typography>
          )}

          {/* Schedule badge */}
          {scheduleLabel && (
            <Typography variant="caption" color="text.secondary" className="font-mono">
              {scheduleLabel}
            </Typography>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <CalendarTodayIcon sx={{ fontSize: 11, color: "text.disabled" }} />
              <Typography variant="caption" color="text.disabled">{date}</Typography>
            </div>
            <Chip label="Assigned" size="small" color="secondary" variant="outlined" />
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function TeacherCoursesPanel() {
  const user = useAppSelector(selectUser);
  const { courses, loading, error, refetch } = useTeacherCourses(user?.uid ?? "");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Courses"
        subtitle="Click a course to view its students."
        icon={<SchoolIcon />}
        actions={
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={refetch} disabled={loading} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        }
      />

      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box className="flex justify-center py-16"><CircularProgress color="secondary" /></Box>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<SchoolIcon />}
          title="No courses assigned yet."
          subtitle="An administrator will assign courses to you."
        />
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <CourseCard course={course} />
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}

export default function TeacherCoursesPage() {
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <TeacherCoursesPanel />
    </RouteGuard>
  );
}
