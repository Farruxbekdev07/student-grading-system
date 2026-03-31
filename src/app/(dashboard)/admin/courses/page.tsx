"use client";
// app/(dashboard)/admin/courses/page.tsx
// -------------------------------------------------
// v2: added schedule builder per course.
// Admin can open a "Schedule" dialog for any course
// to add/remove weekly recurring time slots.
// All schedule writes go through updateSchedule()
// in course.service.ts → useAdminCourses hook.
// -------------------------------------------------

import React, { useState, useMemo } from "react";
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
import Chip from "@mui/material/Chip";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import SchoolIcon from "@mui/icons-material/School";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { RouteGuard } from "@/components/RouteGuard";
import { useAdminCourses } from "@/hooks/useCourses";
import { useUsers } from "@/hooks/useUsers";
import { Course, ScheduleItem, WeekDay } from "@/types/course";
import { updateSchedule } from "@/services/course.service";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS: WeekDay[] = [
  "monday","tuesday","wednesday","thursday","friday","saturday","sunday",
];

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── Schedule Builder Dialog ──────────────────────────────────────────────────
function ScheduleDialog({
  course,
  onClose,
  onSaved,
}: {
  course:   Course;
  onClose:  () => void;
  onSaved:  (msg: string) => void;
}) {
  const [items,   setItems]   = useState<ScheduleItem[]>(course.schedule ?? []);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const addRow = () => {
    setItems((prev) => [...prev, { day: "monday", startTime: "09:00", endTime: "10:00" }]);
  };

  const removeRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, patch: Partial<ScheduleItem>) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  };

  const handleSave = async () => {
    // Basic validation
    for (const item of items) {
      if (item.startTime >= item.endTime) {
        setError("Start time must be before end time for all rows.");
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      await updateSchedule(course.id, items);
      onSaved(`Schedule for "${course.name}" saved.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        <div className="flex items-center gap-2">
          <CalendarMonthIcon color="primary" fontSize="small" />
          Schedule — {course.name}
        </div>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Weekly recurring schedule. Add one row per time slot.
        </Typography>

        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

        {/* Schedule rows */}
        {items.length === 0 ? (
          <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 2 }}>
            No schedule yet. Click "Add slot" to begin.
          </Typography>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Day</InputLabel>
                <Select
                  value={item.day}
                  label="Day"
                  onChange={(e: SelectChangeEvent) =>
                    updateRow(idx, { day: e.target.value as WeekDay })
                  }
                  disabled={saving}
                >
                  {DAYS.map((d) => (
                    <MenuItem key={d} value={d}>{capitalize(d)}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Start"
                type="time"
                value={item.startTime}
                onChange={(e) => updateRow(idx, { startTime: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 110 }}
                disabled={saving}
              />

              <TextField
                label="End"
                type="time"
                value={item.endTime}
                onChange={(e) => updateRow(idx, { endTime: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 110 }}
                disabled={saving}
              />

              <Tooltip title="Remove slot">
                <IconButton size="small" color="error" onClick={() => removeRow(idx)} disabled={saving}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          ))
        )}

        <div>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addRow}
            disabled={saving}
            variant="outlined"
          >
            Add slot
          </Button>
        </div>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} variant="outlined" color="inherit" size="small">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          size="small"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {saving ? "Saving…" : "Save Schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Create course form ───────────────────────────────────────────────────────
function CreateCourseForm({
  creating,
  onSubmit,
}: {
  creating: boolean;
  onSubmit: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [localErr, setLocalErr]        = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr("");
    if (!name.trim()) { setLocalErr("Course name is required."); return; }
    await onSubmit(name, description);
    setName("");
    setDescription("");
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AddIcon color="primary" fontSize="small" />
          <Typography variant="h6" fontWeight={600}>Create New Course</Typography>
        </div>
        {localErr && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{localErr}</Alert>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Course name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            size="small"
            disabled={creating}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            size="small"
            disabled={creating}
          />
          <div>
            <Button
              type="submit"
              variant="contained"
              disabled={creating || !name.trim()}
              startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
            >
              {creating ? "Creating…" : "Create Course"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Course table row ─────────────────────────────────────────────────────────
function CourseRow({
  course,
  teachers,
  isMutating,
  onAssign,
  onUnassign,
  onEditSchedule,
}: {
  course:          Course;
  teachers:        { uid: string; name: string }[];
  isMutating:      boolean;
  onAssign:        (courseId: string, teacherId: string, teacherName: string) => void;
  onUnassign:      (courseId: string) => void;
  onEditSchedule:  (course: Course) => void;
}) {
  const handleChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    if (value === "__unassign__") {
      onUnassign(course.id);
    } else {
      const teacher = teachers.find((t) => t.uid === value);
      if (teacher) onAssign(course.id, teacher.uid, teacher.name);
    }
  };

  const scheduleLabel = course.schedule?.length
    ? `${course.schedule.length} slot${course.schedule.length > 1 ? "s" : ""}`
    : "No schedule";

  return (
    <TableRow hover sx={{ opacity: isMutating ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <TableCell>
        <Typography variant="body2" fontWeight={500}>{course.name}</Typography>
        <Typography variant="caption" color="text.secondary" className="line-clamp-1">
          {course.description || "—"}
        </Typography>
      </TableCell>

      <TableCell>
        {/* Schedule summary + edit button */}
        <div className="flex items-center gap-1">
          <Chip
            label={scheduleLabel}
            size="small"
            variant="outlined"
            color={course.schedule?.length ? "info" : "default"}
            clickable
            onClick={() => onEditSchedule(course)}
            icon={<CalendarMonthIcon sx={{ fontSize: 12 }} />}
          />
        </div>
      </TableCell>

      <TableCell>
        {course.teacherName ? (
          <Chip label={course.teacherName} size="small" color="secondary" variant="outlined" />
        ) : (
          <Chip label="Unassigned" size="small" variant="outlined" />
        )}
      </TableCell>

      <TableCell align="right">
        {isMutating ? (
          <CircularProgress size={20} />
        ) : (
          <Select
            value={course.teacherId ?? ""}
            displayEmpty
            size="small"
            onChange={handleChange}
            sx={{ minWidth: 160, fontSize: 13 }}
            renderValue={(val) =>
              val ? (teachers.find((t) => t.uid === val)?.name ?? val) : "Assign teacher…"
            }
          >
            <MenuItem value="" disabled>
              <em>Assign teacher…</em>
            </MenuItem>
            {teachers.map((t) => (
              <MenuItem key={t.uid} value={t.uid}>{t.name}</MenuItem>
            ))}
            {course.teacherId && (
              <>
                <Divider />
                <MenuItem value="__unassign__" sx={{ color: "error.main" }}>
                  <PersonOffIcon fontSize="small" sx={{ mr: 1 }} />
                  Remove teacher
                </MenuItem>
              </>
            )}
          </Select>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
function AdminCoursesPanel() {
  const {
    courses, loading: coursesLoading, error: coursesError,
    mutatingId, creating,
    addCourse, assignTo, unassignFrom, refetch,
  } = useAdminCourses();

  const { users, loading: usersLoading } = useUsers();
  const teachers = useMemo(
    () => users.filter((u) => u.role === "teacher"),
    [users]
  );

  const [toast,          setToast]          = useState<string | null>(null);
  const [scheduleCourse, setScheduleCourse] = useState<Course | null>(null);

  const handleCreate = async (name: string, description: string) => {
    const created = await addCourse({ name, description });
    if (created) setToast(`Course "${created.name}" created.`);
  };

  const handleAssign = async (courseId: string, teacherId: string, teacherName: string) => {
    await assignTo(courseId, teacherId, teacherName);
    setToast("Teacher assigned.");
  };

  const handleUnassign = async (courseId: string) => {
    await unassignFrom(courseId);
    setToast("Teacher removed.");
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <SchoolIcon color="primary" />
          <div>
            <Typography variant="h5" fontWeight={700}>Course Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Create courses, set schedules, and assign teachers.
            </Typography>
          </div>
        </div>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={refetch} disabled={coursesLoading}><RefreshIcon /></IconButton>
          </span>
        </Tooltip>
      </div>

      {/* Summary chips */}
      {!coursesLoading && (
        <div className="flex gap-3 flex-wrap">
          <Chip label={`${courses.length} total`} size="small" variant="outlined" />
          <Chip
            label={`${courses.filter((c) => c.teacherId).length} assigned`}
            size="small"
            color="secondary"
            variant="outlined"
          />
          <Chip
            label={`${courses.filter((c) => !c.teacherId).length} unassigned`}
            size="small"
            variant="outlined"
          />
        </div>
      )}

      {coursesError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{coursesError}</Alert>
      )}

      {/* Create form */}
      <CreateCourseForm creating={creating} onSubmit={handleCreate} />

      {/* Course list */}
      {coursesLoading ? (
        <Box className="flex justify-center py-12"><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12 } }}>
                <TableCell>Course</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell align="right">
                  {usersLoading ? <CircularProgress size={14} /> : "Assign Teacher"}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No courses yet. Create one above.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    teachers={teachers}
                    isMutating={mutatingId === course.id}
                    onAssign={handleAssign}
                    onUnassign={handleUnassign}
                    onEditSchedule={setScheduleCourse}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Schedule dialog — mounts only when a course is selected */}
      {scheduleCourse && (
        <ScheduleDialog
          course={scheduleCourse}
          onClose={() => setScheduleCourse(null)}
          onSaved={(msg) => {
            setScheduleCourse(null);
            setToast(msg);
            refetch(); // reload to show updated slot count
          }}
        />
      )}

      {/* Toast */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default function AdminCoursesPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminCoursesPanel />
    </RouteGuard>
  );
}
