"use client";
// app/(dashboard)/student/courses/page.tsx
// v2: cards navigate to /student/course/[id]/lessons.

import React from "react";
import Typography  from "@mui/material/Typography";
import Card        from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid        from "@mui/material/Grid";
import Chip        from "@mui/material/Chip";
import Alert       from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box         from "@mui/material/Box";
import ChevronRightIcon  from "@mui/icons-material/ChevronRight";
import SchoolIcon        from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useRouter }     from "next/navigation";
import { RouteGuard }    from "@/components/RouteGuard";
import { PageHeader }    from "@/components/layout/PageHeader";
import { EmptyState }    from "@/components/ui/EmptyState";
import { useStudentEnrollments } from "@/hooks/useEnrollments";
import { useAppSelector } from "@/store";
import { selectUser }     from "@/store/slices/authSlice";

function StudentCoursesPanel() {
  const user = useAppSelector(selectUser);
  const router = useRouter();
  const { enrollments, loading, error, refetch } = useStudentEnrollments(user?.uid ?? "");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Courses"
        subtitle="Click a course to see its lessons."
        icon={<SchoolIcon />}
      />

      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box className="flex justify-center py-16"><CircularProgress /></Box>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={<SchoolIcon />}
          title="Not enrolled in any courses yet."
          subtitle="Your administrator will enroll you in available courses."
        />
      ) : (
        <Grid container spacing={3}>
          {enrollments.map((e) => (
            <Grid item xs={12} sm={6} md={4} key={e.id}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                <CardActionArea
                  onClick={() => router.push(`/student/course/${e.courseId}/lessons`)}
                  sx={{ height: "100%" }}
                >
                  <CardContent className="p-5 flex flex-col gap-3 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <Typography variant="h6" fontWeight={600} className="flex-1 leading-snug">
                        {e.courseName}
                      </Typography>
                      <ChevronRightIcon color="action" fontSize="small" />
                    </div>
                    <div className="flex items-center gap-1 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                      <CalendarTodayIcon sx={{ fontSize: 11, color: "text.disabled" }} />
                      <Typography variant="caption" color="text.disabled">
                        Enrolled{" "}
                        {e.createdAt
                          ? new Date(e.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
                          : ""}
                      </Typography>
                    </div>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}

export default function StudentCoursesPage() {
  return (
    <RouteGuard allowedRoles={["student"]}>
      <StudentCoursesPanel />
    </RouteGuard>
  );
}
