"use client";
// app/(dashboard)/teacher/course/[courseId]/lesson/[lessonId]/grades/page.tsx
// -------------------------------------------------
// Lesson-level grading page. Replaces the old course-level grades page.
// Fetches enrolled students + existing lesson grades and merges into
// an editable table. Bulk-saves via writeBatch on "Save All".
// -------------------------------------------------

import React, { use } from "react";
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
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GradingIcon from "@mui/icons-material/Grading";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { useLessonGrades } from "@/hooks/useGrades";
import { GradeRow, METRIC_KEYS } from "@/types/grade";

// ─── Metric input cell ────────────────────────────────────────────────────────
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
  onChange: (sid: string, field: keyof GradeRow, val: number) => void;
}) {
  return (
    <TableCell align="center" sx={{ p: "6px 4px" }}>
      <TextField
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const raw = parseFloat(e.target.value);
          const clamped = Math.min(100, Math.max(0, isNaN(raw) ? 0 : raw));
          onChange(studentId, field, clamped);
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

// ─── Grade table row ──────────────────────────────────────────────────────────
function GradeTableRow({
  row,
  saving,
  onUpdate,
}: {
  row: GradeRow;
  saving: boolean;
  onUpdate: (sid: string, field: keyof GradeRow, val: number) => void;
}) {
  const disabled = saving || row.isSaving;
  return (
    <TableRow
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
          disabled={disabled}
          onChange={onUpdate}
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
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
function LessonGradesPanel({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const router = useRouter();

  // lessonTitle will be populated from denormalized data after first save;
  // for now we pass the lessonId as a fallback display string.
  // If you add a useLessonById hook, pass the real title here.
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
  } = useLessonGrades(lessonId, courseId, "");

  console.log("courseId:", courseId, "lessonId:", lessonId);

  const COLUMNS = [
    "Student",
    ...METRIC_KEYS.map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
    "Overall",
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Tooltip title="Back to lessons">
            <IconButton
              size="small"
              onClick={() => router.push(`/teacher/course/${courseId}/lessons`)}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <div className="flex items-center gap-2">
            <GradingIcon color="secondary" />
            <div>
              <Typography variant="h5" fontWeight={700}>
                Grade Entry
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scores 0–100 · overall auto-calculated
              </Typography>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={refetch} disabled={loading || saving}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color="secondary"
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
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

      {/* Feedback */}
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
          You have unsaved changes. Click "Save All" to commit.
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <Box className="flex justify-center py-16">
          <CircularProgress color="secondary" />
        </Box>
      ) : rows.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ borderRadius: 2, p: 6, textAlign: "center" }}
        >
          <Typography variant="body1" color="text.secondary">
            No students enrolled in this course yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {COLUMNS.map((col) => (
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
                <GradeTableRow
                  key={row.studentId}
                  row={row}
                  saving={saving}
                  onUpdate={updateCell}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default function LessonGradesPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const { courseId, lessonId } = params;
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <LessonGradesPanel courseId={courseId} lessonId={lessonId} />
    </RouteGuard>
  );
}
