"use client";
// app/(dashboard)/teacher/course/[courseId]/lessons/page.tsx
// -------------------------------------------------
// Teacher creates and views lessons for their course.
// Clicking a lesson row navigates to the grading page.
// All logic via useTeacherLessons → lesson.service.ts
// -------------------------------------------------

import React, { use, useState } from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import GradingIcon from "@mui/icons-material/Grading";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { useTeacherLessons } from "@/hooks/useLessons";

// ─── Create lesson form ───────────────────────────────────────────────────────
function CreateLessonForm({
  courseId,
  creating,
  onSubmit,
}: {
  courseId: string;
  creating: boolean;
  onSubmit: (title: string, date: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }
    if (!date) {
      setErr("Date is required.");
      return;
    }
    await onSubmit(title, date);
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AddIcon color="secondary" fontSize="small" />
          <Typography variant="h6" fontWeight={600}>
            Create New Lesson
          </Typography>
        </div>
        {err && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {err}
          </Alert>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-4 items-end"
        >
          <TextField
            label="Lesson title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
            required
            sx={{ flex: 2 }}
            disabled={creating}
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            size="small"
            required
            sx={{ flex: 1 }}
            disabled={creating}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={creating || !title.trim()}
            startIcon={
              creating ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
            sx={{ height: 40, whiteSpace: "nowrap" }}
          >
            {creating ? "Creating…" : "Add Lesson"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
function LessonsPanel({ courseId }: { courseId: string }) {
  const router = useRouter();
  const {
    lessons,
    loading,
    error,
    creating,
    addLesson,
    removeLesson,
    refetch,
  } = useTeacherLessons(courseId);

  const [toast, setToast] = useState<string | null>(null);

  const handleCreate = async (title: string, date: string) => {
    const created = await addLesson({ courseId, title, date });
    if (created) setToast(`Lesson "${created.title}" created.`);
  };

  const handleDelete = async (lessonId: string, title: string) => {
    await removeLesson(lessonId);
    setToast(`Lesson "${title}" deleted.`);
  };

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
            <MenuBookIcon color="secondary" />
            <div>
              <Typography variant="h5" fontWeight={700}>
                Lessons
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create lessons and enter grades per lesson.
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

      {/* Count */}
      {!loading && (
        <Chip
          label={`${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`}
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ alignSelf: "flex-start" }}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Create form */}
      <CreateLessonForm
        courseId={courseId}
        creating={creating}
        onSubmit={handleCreate}
      />

      {/* Lessons table */}
      {loading ? (
        <Box className="flex justify-center py-12">
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12 } }}>
                <TableCell>Title</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No lessons yet. Create one above.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                lessons.map((lesson) => (
                  <TableRow key={lesson.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {lesson.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(lesson.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center gap-1 justify-end">
                        <Tooltip title="Enter grades">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() =>
                              router.push(
                                `/teacher/course/${courseId}/lesson/${lesson.id}/grades`,
                              )
                            }
                          >
                            <GradingIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete lesson">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleDelete(lesson.id, lesson.title)
                            }
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setToast(null)}
          sx={{ borderRadius: 2 }}
        >
          {toast}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default function LessonsPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <LessonsPanel courseId={courseId} />
    </RouteGuard>
  );
}
