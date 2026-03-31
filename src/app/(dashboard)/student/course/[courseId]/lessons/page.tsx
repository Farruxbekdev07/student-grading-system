"use client";
// app/(dashboard)/student/course/[courseId]/lessons/page.tsx
// Per-course lesson list for students.

import React, { use } from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTeacherLessons } from "@/hooks/useLessons"; // same fetch, read-only for student

function StudentCourseLessonsPanel({ courseId }: { courseId: string }) {
  const router = useRouter();
  // useTeacherLessons is a pure read — safe for students
  const { lessons, loading, error } = useTeacherLessons(courseId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lessons"
        subtitle="Select a lesson to view your grade."
        icon={<MenuBookIcon />}
        backHref="/student/courses"
        backLabel="Back to my courses"
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
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={<MenuBookIcon />}
          title="No lessons yet."
          subtitle="Your teacher will add lessons once the course begins."
        />
      ) : (
        <Grid container spacing={2}>
          {lessons.map((lesson) => (
            <Grid item xs={12} sm={6} key={lesson.id}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardActionArea
                  onClick={() =>
                    router.push(
                      `/student/grades?lessonId=${lesson.id}&courseId=${courseId}`,
                    )
                  }
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <MenuBookIcon color="secondary" fontSize="small" />
                    <div className="flex-1">
                      <Typography variant="body1" fontWeight={600}>
                        {lesson.title}
                      </Typography>
                      <div className="flex items-center gap-1 mt-0.5">
                        <CalendarTodayIcon
                          sx={{ fontSize: 11, color: "text.disabled" }}
                        />
                        <Typography variant="caption" color="text.disabled">
                          {new Date(lesson.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Typography>
                      </div>
                    </div>
                    <ChevronRightIcon color="action" fontSize="small" />
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

export default function StudentCourseLessonsPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;
  return (
    <RouteGuard allowedRoles={["student"]}>
      <StudentCourseLessonsPanel courseId={courseId} />
    </RouteGuard>
  );
}
