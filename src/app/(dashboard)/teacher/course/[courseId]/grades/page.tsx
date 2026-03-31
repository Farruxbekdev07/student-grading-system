"use client";
// app/(dashboard)/teacher/course/[courseId]/grades/page.tsx
// Course-scoped grades page. Teacher first selects a lesson,
// then the grading table appears. No implicit lesson assumption.

import React, { use, useState, useMemo } from "react";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import GradingIcon from "@mui/icons-material/Grading";
import { RouteGuard } from "@/components/RouteGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTeacherLessons } from "@/hooks/useLessons";
import { useLessonGrades } from "@/hooks/useGrades";
import { GradeRow, METRIC_KEYS } from "@/types/grade";

// ─── Metric cell ──────────────────────────────────────────────────────────────
function MetricCell({
  studentId,
  field,
  value,
  disabled,
  onChange,
}: {
  studentId: string;
  field: keyof GradeRow;
  value: number;
  disabled: boolean;
  onChange: (sid: string, f: keyof GradeRow, v: number) => void;
}) {
  return (
    <TableCell align="center" sx={{ p: "6px 4px" }}>
      <TextField
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const raw = parseFloat(e.target.value);
          onChange(
            studentId,
            field,
            Math.min(100, Math.max(0, isNaN(raw) ? 0 : raw)),
          );
        }}
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
          style: { textAlign: "center", padding: "6px 4px" },
        }}
        size="small"
        sx={{ width: 72 }}
      />
    </TableCell>
  );
}

// ─── Grading table ────────────────────────────────────────────────────────────
function GradingTable({
  lessonId,
  courseId,
  lessonTitle,
}: {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
}) {
  const {
    rows,
    loading,
    saving,
    error,
    successMsg,
    hasDirty,
    updateCell,
    saveAll,
    refetch,
    dismissError,
  } = useLessonGrades(lessonId, courseId, lessonTitle);

  const COLS = [
    "Student",
    ...METRIC_KEYS.map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
    "Overall",
  ];

  if (loading)
    return (
      <Box className="flex justify-center py-10">
        <CircularProgress />
      </Box>
    );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert severity="error" onClose={dismissError} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          {successMsg}
        </Alert>
      )}
      {hasDirty && !saving && (
        <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>
          Unsaved changes — click "Save All".
        </Alert>
      )}
      <div className="flex justify-between items-center">
        <Typography variant="body2" color="text.secondary">
          {rows.length} student{rows.length !== 1 ? "s" : ""}
        </Typography>
        <div className="flex gap-2">
          <Tooltip title="Refresh">
            <span>
              <IconButton size="small" onClick={refetch} disabled={saving}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={
              saving ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            disabled={!hasDirty || saving}
            onClick={saveAll}
          >
            {saving ? "Saving…" : "Save All"}
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<GradingIcon />}
          title="No students enrolled in this course."
        />
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {COLS.map((col) => (
                  <TableCell
                    key={col}
                    align={col === "Student" ? "left" : "center"}
                    sx={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.studentId}
                  hover
                  sx={{
                    bgcolor: row.isDirty ? "action.hover" : "transparent",
                    transition: "background-color 0.15s",
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Typography variant="body2" fontWeight={500}>
                        {row.studentName}
                      </Typography>
                      {row.isDirty && (
                        <Chip
                          label="edited"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      )}
                      {row.isSaving && <CircularProgress size={14} />}
                    </div>
                  </TableCell>
                  {METRIC_KEYS.map((key) => (
                    <MetricCell
                      key={key}
                      studentId={row.studentId}
                      field={key}
                      value={row[key]}
                      disabled={saving || row.isSaving}
                      onChange={updateCell}
                    />
                  ))}
                  <TableCell align="center">
                    <Chip
                      label={row.overall.toFixed(1)}
                      size="small"
                      color={
                        row.overall >= 80
                          ? "success"
                          : row.overall >= 60
                            ? "warning"
                            : "default"
                      }
                      variant="outlined"
                      sx={{ minWidth: 52, fontWeight: 600 }}
                    />
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

// ─── Page ─────────────────────────────────────────────────────────────────────
function CourseGradesPanel({ courseId }: { courseId: string }) {
  const { lessons, loading: lessonsLoading } = useTeacherLessons(courseId);
  const [lessonId, setLessonId] = useState("");
  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === lessonId) ?? null,
    [lessons, lessonId],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Grade Entry"
        subtitle="Select a lesson to load the grading table."
        icon={<GradingIcon />}
        backHref={`/teacher/course/${courseId}/students`}
        backLabel="Back to students"
      />

      {/* Lesson selector */}
      <FormControl
        size="small"
        sx={{ maxWidth: 360 }}
        disabled={lessonsLoading}
      >
        <InputLabel>Select lesson</InputLabel>
        <Select
          value={lessonId}
          label="Select lesson"
          onChange={(e: SelectChangeEvent) => setLessonId(e.target.value)}
        >
          <MenuItem value="" disabled>
            <em>Select a lesson…</em>
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

      {!lessonId && !lessonsLoading && lessons.length === 0 && (
        <EmptyState
          icon={<GradingIcon />}
          title="No lessons yet."
          subtitle="Create lessons from the Lessons page first."
        />
      )}
      {!lessonId && lessons.length > 0 && (
        <EmptyState
          icon={<GradingIcon />}
          title="Select a lesson above to load the grading table."
        />
      )}
      {lessonsLoading && (
        <Box className="flex justify-center py-6">
          <CircularProgress size={28} />
        </Box>
      )}

      {lessonId && (
        <GradingTable
          lessonId={lessonId}
          courseId={courseId}
          lessonTitle={selectedLesson?.title ?? ""}
        />
      )}
    </div>
  );
}

export default function CourseGradesPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <CourseGradesPanel courseId={courseId} />
    </RouteGuard>
  );
}
