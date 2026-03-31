"use client";
// app/(dashboard)/teacher/analytics/page.tsx
// Global analytics page reachable from sidebar.
// Course selector → lesson selector → radar chart.
// "All lessons" option shows per-student averages.

import React, { useState, useMemo } from "react";
import Typography  from "@mui/material/Typography";
import Paper       from "@mui/material/Paper";
import List        from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip        from "@mui/material/Chip";
import Alert       from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton  from "@mui/material/IconButton";
import Tooltip     from "@mui/material/Tooltip";
import Box         from "@mui/material/Box";
import Divider     from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel  from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem    from "@mui/material/MenuItem";
import RefreshIcon  from "@mui/icons-material/Refresh";
import BarChartIcon from "@mui/icons-material/BarChart";
import { RouteGuard }         from "@/components/RouteGuard";
import { PageHeader }         from "@/components/layout/PageHeader";
import { EmptyState }         from "@/components/ui/EmptyState";
import { useTeacherCourses }  from "@/hooks/useCourses";
import { useTeacherLessons }  from "@/hooks/useLessons";
import { useCourseAnalytics } from "@/hooks/useGrades";
import { GradeRadarChart, gradeToRadarData } from "@/components/GradeRadarChart";
import { useAppSelector }     from "@/store";
import { selectUser }         from "@/store/slices/authSlice";
import { Grade, GradeMetrics, METRIC_KEYS } from "@/types/grade";

// ─── Aggregate helper ─────────────────────────────────────────────────────────
function aggregateGrades(grades: Grade[]): GradeMetrics & { overall: number } {
  const n = grades.length;
  if (n === 0) return { listening: 0, reading: 0, speaking: 0, writing: 0, interest: 0, overall: 0 };
  const sums = grades.reduce(
    (acc, g) => {
      METRIC_KEYS.forEach((k) => { acc[k] += g.metrics[k]; });
      acc.overall += g.overall;
      return acc;
    },
    { listening: 0, reading: 0, speaking: 0, writing: 0, interest: 0, overall: 0 } as Record<string, number>
  );
  const result: Record<string, number> = {};
  [...METRIC_KEYS, "overall"].forEach((k) => {
    result[k] = Math.round((sums[k] / n) * 10) / 10;
  });
  return result as GradeMetrics & { overall: number };
}

interface StudentSummary {
  studentId:   string;
  studentName: string;
  metrics:     GradeMetrics;
  overall:     number;
}

// ─── Chart panel ──────────────────────────────────────────────────────────────
function AnalyticsChart({ courseId }: { courseId: string }) {
  const { grades, loading, error, refetch } = useCourseAnalytics(courseId);
  const { lessons, loading: lessonsLoading } = useTeacherLessons(courseId);

  const [selectedLessonId,   setSelectedLessonId]   = useState<string>("__all__");
  const [selectedStudentId,  setSelectedStudentId]   = useState<string | null>(null);

  const studentSummaries = useMemo((): StudentSummary[] => {
    const filtered =
      selectedLessonId === "__all__"
        ? grades
        : grades.filter((g) => g.lessonId === selectedLessonId);

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
          metrics: { listening: agg.listening, reading: agg.reading, speaking: agg.speaking, writing: agg.writing, interest: agg.interest },
          overall: agg.overall,
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [grades, selectedLessonId]);

  const selected = useMemo(() => {
    if (!studentSummaries.length) return null;
    const target = selectedStudentId ?? studentSummaries[0].studentId;
    return studentSummaries.find((s) => s.studentId === target) ?? studentSummaries[0];
  }, [studentSummaries, selectedStudentId]);

  const radarData = useMemo(() => selected ? gradeToRadarData(selected.metrics) : [], [selected]);

  if (loading || lessonsLoading) return <Box className="flex justify-center py-10"><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;

  return (
    <div className="flex flex-col gap-4">
      {/* Lesson selector */}
      <div className="flex items-center justify-between gap-4">
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel>Lesson</InputLabel>
          <Select
            value={selectedLessonId}
            label="Lesson"
            onChange={(e: SelectChangeEvent) => {
              setSelectedLessonId(e.target.value);
              setSelectedStudentId(null);
            }}
          >
            <MenuItem value="__all__"><em>All lessons (averaged)</em></MenuItem>
            {lessons.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.title} — {new Date(l.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Refresh"><span>
          <IconButton size="small" onClick={refetch}><RefreshIcon fontSize="small" /></IconButton>
        </span></Tooltip>
      </div>

      {studentSummaries.length === 0 ? (
        <EmptyState icon={<BarChartIcon />} title="No grades recorded for this selection." />
      ) : (
        <div className="flex gap-4 items-start">
          {/* Student list */}
          <Paper variant="outlined" sx={{ borderRadius: 2, minWidth: 190, maxWidth: 220, flexShrink: 0, maxHeight: 440, overflow: "auto" }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary"
              sx={{ px: 2, pt: 1.5, pb: 0.5, display: "block", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Students
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
                    primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                  <Chip
                    label={s.overall.toFixed(0)}
                    size="small"
                    color={s.overall >= 80 ? "success" : s.overall >= 60 ? "warning" : "default"}
                    variant="outlined"
                    sx={{ ml: 1, minWidth: 36, fontWeight: 700 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>

          {/* Radar chart */}
          <Paper variant="outlined" sx={{ borderRadius: 2, flex: 1, p: 3, minHeight: 360 }}>
            {selected ? (
              <>
                <GradeRadarChart studentName={selected.studentName} data={radarData} color="#6366F1" />
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {METRIC_KEYS.map((k) => (
                    <Chip key={k} label={`${k.charAt(0).toUpperCase() + k.slice(1)}: ${selected.metrics[k]}`} size="small" variant="outlined" />
                  ))}
                  <Chip label={`Overall: ${selected.overall.toFixed(1)}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                </div>
              </>
            ) : (
              <Box className="flex items-center justify-center h-full py-12">
                <Typography variant="body2" color="text.secondary">Select a student to see their chart.</Typography>
              </Box>
            )}
          </Paper>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function TeacherAnalyticsPanel() {
  const user = useAppSelector(selectUser);
  const { courses, loading: coursesLoading } = useTeacherCourses(user?.uid ?? "");
  const [courseId, setCourseId] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        subtitle="Select a course and lesson to view student performance."
        icon={<BarChartIcon />}
      />

      {/* Course selector */}
      <FormControl size="small" sx={{ maxWidth: 320 }} disabled={coursesLoading}>
        <InputLabel>Course</InputLabel>
        <Select
          value={courseId}
          label="Course"
          onChange={(e: SelectChangeEvent) => setCourseId(e.target.value)}
        >
          <MenuItem value="" disabled><em>Select a course…</em></MenuItem>
          {courses.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {!courseId ? (
        <EmptyState icon={<BarChartIcon />} title="No course selected." subtitle="Use the dropdown above to choose a course." />
      ) : (
        <AnalyticsChart courseId={courseId} />
      )}
    </div>
  );
}

export default function TeacherAnalyticsPage() {
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <TeacherAnalyticsPanel />
    </RouteGuard>
  );
}
