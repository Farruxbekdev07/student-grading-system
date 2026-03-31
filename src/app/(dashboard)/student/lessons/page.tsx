"use client";
// app/(dashboard)/student/lessons/page.tsx
// -------------------------------------------------
// Student sees all lessons from their enrolled courses.
// Clicking a lesson shows the grades radar for that lesson.
// Uses useStudentEnrollments (existing) + useStudentLessons (new).
// -------------------------------------------------

import React, { useState, useMemo } from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GradeIcon from "@mui/icons-material/Grade";
import CloseIcon from "@mui/icons-material/Close";
import { RouteGuard } from "@/components/RouteGuard";
import { useStudentEnrollments } from "@/hooks/useEnrollments";
import { useStudentLessons } from "@/hooks/useLessons";
import { useStudentGrades } from "@/hooks/useGrades";
import { GradeRadarChart, gradeToRadarData } from "@/components/GradeRadarChart";
import { useAppSelector } from "@/store";
import { selectUser } from "@/store/slices/authSlice";
import { Lesson } from "@/types/lesson";
import { METRIC_KEYS } from "@/types/grade";

// ─── Lesson card ──────────────────────────────────────────────────────────────
function LessonCard({
  lesson,
  hasGrade,
  onClick,
}: {
  lesson:   Lesson;
  hasGrade: boolean;
  onClick:  () => void;
}) {
  const date = new Date(lesson.date).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardActionArea onClick={onClick}>
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <MenuBookIcon color="secondary" fontSize="small" />
              <Typography variant="body1" fontWeight={600}>{lesson.title}</Typography>
            </div>
            {hasGrade
              ? <Chip label="Graded" size="small" color="success" variant="outlined" />
              : <Chip label="No grade" size="small" variant="outlined" />
            }
          </div>
          <div className="flex items-center gap-1">
            <CalendarTodayIcon sx={{ fontSize: 12, color: "text.disabled" }} />
            <Typography variant="caption" color="text.disabled">{date}</Typography>
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ─── Grade detail dialog ──────────────────────────────────────────────────────
function GradeDialog({
  open,
  lessonTitle,
  studentName,
  grade,
  onClose,
}: {
  open:        boolean;
  lessonTitle: string;
  studentName: string;
  grade:       { metrics: Record<string, number>; overall: number } | null;
  onClose:     () => void;
}) {
  const radarData = grade
    ? gradeToRadarData({
        listening: grade.metrics.listening ?? 0,
        reading:   grade.metrics.reading   ?? 0,
        speaking:  grade.metrics.speaking  ?? 0,
        writing:   grade.metrics.writing   ?? 0,
        interest:  grade.metrics.interest  ?? 0,
      })
    : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1, display: "flex", justifyContent: "space-between" }}>
        {lessonTitle}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {!grade ? (
          <Box className="flex flex-col items-center gap-2 py-8">
            <GradeIcon sx={{ fontSize: 40, color: "text.disabled" }} />
            <Typography variant="body1" color="text.secondary">
              No grade recorded for this lesson yet.
            </Typography>
          </Box>
        ) : (
          <div className="flex flex-col gap-3">
            <GradeRadarChart studentName={studentName} data={radarData} color="#EC4899" />
            <div className="flex flex-wrap gap-2 justify-center">
              {METRIC_KEYS.map((k) => (
                <Chip
                  key={k}
                  label={`${k.charAt(0).toUpperCase() + k.slice(1)}: ${grade.metrics[k] ?? 0}`}
                  size="small"
                  variant="outlined"
                />
              ))}
              <Chip
                label={`Overall: ${grade.overall.toFixed(1)}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
function StudentLessonsPanel() {
  const user = useAppSelector(selectUser);

  const { enrollments, loading: enrollLoading } = useStudentEnrollments(user?.uid ?? "");
  const courseIds = useMemo(
    () => enrollments.map((e) => e.courseId),
    [enrollments]
  );

  const { lessons, loading: lessonsLoading, error, refetch } = useStudentLessons(courseIds);
  const { grades,  loading: gradesLoading  } = useStudentGrades(user?.uid ?? "");

  // Map lessonId → grade for quick lookup
  const gradeByLesson = useMemo(
    () => new Map(grades.map((g) => [g.lessonId, g])),
    [grades]
  );

  const [dialogLesson, setDialogLesson] = useState<Lesson | null>(null);
  const dialogGrade = dialogLesson ? gradeByLesson.get(dialogLesson.id) ?? null : null;

  const loading = enrollLoading || lessonsLoading || gradesLoading;

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <MenuBookIcon color="secondary" />
          <div>
            <Typography variant="h5" fontWeight={700}>My Lessons</Typography>
            <Typography variant="body2" color="text.secondary">
              All lessons from your enrolled courses. Click to see your grade.
            </Typography>
          </div>
        </div>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={refetch} disabled={loading}><RefreshIcon /></IconButton>
          </span>
        </Tooltip>
      </div>

      {!loading && (
        <div className="flex gap-3 flex-wrap">
          <Chip label={`${lessons.length} lessons`} size="small" variant="outlined" />
          <Chip
            label={`${grades.length} graded`}
            size="small"
            color="success"
            variant="outlined"
          />
        </div>
      )}

      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box className="flex justify-center py-16"><CircularProgress color="secondary" /></Box>
      ) : lessons.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent className="py-14 flex flex-col items-center gap-2">
            <MenuBookIcon sx={{ fontSize: 44, color: "text.disabled" }} />
            <Typography variant="body1" color="text.secondary">
              No lessons yet.
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Your teacher will add lessons once your course begins.
            </Typography>
          </CardContent>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {lessons.map((lesson) => (
            <Grid item xs={12} sm={6} md={4} key={lesson.id}>
              <LessonCard
                lesson={lesson}
                hasGrade={gradeByLesson.has(lesson.id)}
                onClick={() => setDialogLesson(lesson)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <GradeDialog
        open={!!dialogLesson}
        lessonTitle={dialogLesson?.title ?? ""}
        studentName={user?.name ?? ""}
        grade={dialogGrade
          ? { metrics: dialogGrade.metrics as Record<string, number>, overall: dialogGrade.overall }
          : null
        }
        onClose={() => setDialogLesson(null)}
      />
    </div>
  );
}

export default function StudentLessonsPage() {
  return (
    <RouteGuard allowedRoles={["student"]}>
      <StudentLessonsPanel />
    </RouteGuard>
  );
}
