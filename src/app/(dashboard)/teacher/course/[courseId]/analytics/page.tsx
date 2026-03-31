"use client";
// app/(dashboard)/teacher/course/[courseId]/analytics/page.tsx
// -------------------------------------------------
// v2: lesson-based analytics.
//
// Lesson selector at the top:
//   "All lessons" → aggregate average per student across all lessons
//   Specific lesson → show grades for that lesson only
//
// Left sidebar: student list with overall chip
// Right panel:  radar chart for selected student
// -------------------------------------------------

import React, { use, useState, useMemo } from "react";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import RefreshIcon from "@mui/icons-material/Refresh";
import BarChartIcon from "@mui/icons-material/BarChart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { useCourseAnalytics } from "@/hooks/useGrades";
import { useTeacherLessons } from "@/hooks/useLessons";
import {
  GradeRadarChart,
  gradeToRadarData,
} from "@/components/GradeRadarChart";
import { Grade, GradeMetrics, METRIC_KEYS } from "@/types/grade";

// ─── Per-student aggregate helper ────────────────────────────────────────────
// Given multiple grade docs for the same student, returns the average metrics.
function aggregateGrades(grades: Grade[]): GradeMetrics & { overall: number } {
  const n = grades.length;
  if (n === 0)
    return {
      listening: 0,
      reading: 0,
      speaking: 0,
      writing: 0,
      interest: 0,
      overall: 0,
    };
  const sums = grades.reduce(
    (acc, g) => {
      METRIC_KEYS.forEach((k) => {
        acc[k] += g.metrics[k];
      });
      acc.overall += g.overall;
      return acc;
    },
    {
      listening: 0,
      reading: 0,
      speaking: 0,
      writing: 0,
      interest: 0,
      overall: 0,
    },
  );
  return {
    listening: Math.round((sums.listening / n) * 10) / 10,
    reading: Math.round((sums.reading / n) * 10) / 10,
    speaking: Math.round((sums.speaking / n) * 10) / 10,
    writing: Math.round((sums.writing / n) * 10) / 10,
    interest: Math.round((sums.interest / n) * 10) / 10,
    overall: Math.round((sums.overall / n) * 10) / 10,
  };
}

// ─── Student summary row for sidebar ─────────────────────────────────────────
interface StudentSummary {
  studentId: string;
  studentName: string;
  metrics: GradeMetrics;
  overall: number;
}

// ─── Main analytics panel ─────────────────────────────────────────────────────
function AnalyticsPanel({ courseId }: { courseId: string }) {
  const router = useRouter();
  const {
    grades,
    loading: gradesLoading,
    error,
    refetch,
  } = useCourseAnalytics(courseId);
  const { lessons, loading: lessonsLoading } = useTeacherLessons(courseId);

  const [selectedLessonId, setSelectedLessonId] = useState<string>("__all__");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );

  // ── Compute per-student summaries for the selected lesson / all lessons ──
  const studentSummaries = useMemo((): StudentSummary[] => {
    const filtered =
      selectedLessonId === "__all__"
        ? grades
        : grades.filter((g) => g.lessonId === selectedLessonId);

    // Group by studentId
    const map = new Map<string, Grade[]>();
    filtered.forEach((g) => {
      const arr = map.get(g.studentId) ?? [];
      arr.push(g);
      map.set(g.studentId, arr);
    });

    return Array.from(map.entries())
      .map(([studentId, gs]) => {
        const agg = aggregateGrades(gs);
        return {
          studentId,
          studentName: gs[0].studentName,
          metrics: {
            listening: agg.listening,
            reading: agg.reading,
            speaking: agg.speaking,
            writing: agg.writing,
            interest: agg.interest,
          },
          overall: agg.overall,
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [grades, selectedLessonId]);

  const selected = useMemo(() => {
    if (!studentSummaries.length) return null;
    const target = selectedStudentId ?? studentSummaries[0].studentId;
    return (
      studentSummaries.find((s) => s.studentId === target) ??
      studentSummaries[0]
    );
  }, [studentSummaries, selectedStudentId]);

  const radarData = useMemo(
    () => (selected ? gradeToRadarData(selected.metrics) : []),
    [selected],
  );

  const loading = gradesLoading || lessonsLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Tooltip title="Back to my courses">
            <IconButton
              size="small"
              onClick={() => router.push("/teacher/courses")}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <div className="flex items-center gap-2">
            <BarChartIcon color="primary" />
            <div>
              <Typography variant="h5" fontWeight={700}>
                Grade Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a lesson or view aggregated averages.
              </Typography>
            </div>
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

      {/* Lesson selector */}
      <FormControl size="small" sx={{ maxWidth: 320 }}>
        <InputLabel>Lesson</InputLabel>
        <Select
          value={selectedLessonId}
          label="Lesson"
          onChange={(e: SelectChangeEvent) => {
            setSelectedLessonId(e.target.value);
            setSelectedStudentId(null); // reset student selection on lesson change
          }}
        >
          <MenuItem value="__all__">
            <em>All lessons (average)</em>
          </MenuItem>
          {lessons.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.title} —{" "}
              {new Date(l.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box className="flex justify-center py-16">
          <CircularProgress />
        </Box>
      ) : studentSummaries.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ borderRadius: 2, p: 6, textAlign: "center" }}
        >
          <Typography variant="body1" color="text.secondary">
            No grades recorded yet for this selection.
          </Typography>
        </Paper>
      ) : (
        <div className="flex gap-4 items-start">
          {/* Sidebar */}
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              minWidth: 200,
              maxWidth: 240,
              flexShrink: 0,
              maxHeight: 440,
              overflow: "auto",
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{ px: 2, pt: 1.5, pb: 0.5, display: "block" }}
            >
              STUDENTS
            </Typography>
            <Divider />
            <List dense disablePadding>
              {studentSummaries.map((s) => (
                <ListItemButton
                  key={s.studentId}
                  selected={selected?.studentId === s.studentId}
                  onClick={() => setSelectedStudentId(s.studentId)}
                  sx={{ px: 2 }}
                >
                  <ListItemText
                    primary={s.studentName}
                    secondary={`Overall: ${s.overall.toFixed(1)}`}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                  <Chip
                    label={s.overall.toFixed(0)}
                    size="small"
                    color={
                      s.overall >= 80
                        ? "success"
                        : s.overall >= 60
                          ? "warning"
                          : "default"
                    }
                    variant="outlined"
                    sx={{ ml: 1, minWidth: 36, fontWeight: 700 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>

          {/* Radar chart */}
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, flex: 1, p: 3, minHeight: 380 }}
          >
            {selected ? (
              <>
                <GradeRadarChart
                  studentName={selected.studentName}
                  data={radarData}
                  color="#6366F1"
                />
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {METRIC_KEYS.map((k) => (
                    <Chip
                      key={k}
                      label={`${k.charAt(0).toUpperCase() + k.slice(1)}: ${selected.metrics[k]}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  <Chip
                    label={`Overall: ${selected.overall.toFixed(1)}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </div>
              </>
            ) : (
              <Box className="flex items-center justify-center h-full py-12">
                <Typography variant="body2" color="text.secondary">
                  Select a student to view their chart.
                </Typography>
              </Box>
            )}
          </Paper>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <AnalyticsPanel courseId={courseId} />
    </RouteGuard>
  );
}
