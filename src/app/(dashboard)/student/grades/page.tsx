"use client";
// app/(dashboard)/student/grades/page.tsx
// v2: course selector → lesson selector → radar chart.
// Supports ?courseId=...&lessonId=... query params for direct linking
// from the lessons page.

import React, { useMemo, useEffect, useState } from "react";
import { useSearchParams }  from "next/navigation";
import Typography    from "@mui/material/Typography";
import Card          from "@mui/material/Card";
import CardContent   from "@mui/material/CardContent";
import Chip          from "@mui/material/Chip";
import Alert         from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box           from "@mui/material/Box";
import Divider       from "@mui/material/Divider";
import FormControl   from "@mui/material/FormControl";
import InputLabel    from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem      from "@mui/material/MenuItem";
import GradeIcon     from "@mui/icons-material/Grade";
import SchoolIcon    from "@mui/icons-material/School";
import { RouteGuard }          from "@/components/RouteGuard";
import { PageHeader }          from "@/components/layout/PageHeader";
import { EmptyState }          from "@/components/ui/EmptyState";
import { GradeRadarChart, gradeToRadarData } from "@/components/GradeRadarChart";
import { useStudentEnrollments } from "@/hooks/useEnrollments";
import { useTeacherLessons }   from "@/hooks/useLessons";
import { useStudentGrades }    from "@/hooks/useGrades";
import { useAppSelector }      from "@/store";
import { selectUser }          from "@/store/slices/authSlice";
import { METRIC_KEYS }         from "@/types/grade";

function StudentGradesPanel() {
  const user = useAppSelector(selectUser);
  const params = useSearchParams();

  const { enrollments, loading: enrollLoading } = useStudentEnrollments(user?.uid ?? "");
  const { grades,      loading: gradesLoading  } = useStudentGrades(user?.uid ?? "");

  // Initialise from query params (set when navigating from lessons page)
  const [courseId,  setCourseId]  = useState(params.get("courseId")  ?? "");
  const [lessonId,  setLessonId]  = useState(params.get("lessonId")  ?? "");

  const { lessons, loading: lessonsLoading } = useTeacherLessons(courseId);

  // Reset lesson when course changes
  const handleCourseChange = (id: string) => {
    setCourseId(id);
    setLessonId("");
  };

  const selectedGrade = useMemo(
    () => grades.find((g) => g.lessonId === lessonId) ?? null,
    [grades, lessonId]
  );
  const radarData = useMemo(
    () => selectedGrade ? gradeToRadarData(selectedGrade.metrics) : [],
    [selectedGrade]
  );

  const loading = enrollLoading || gradesLoading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Grades"
        subtitle="Select a course and lesson to see your performance."
        icon={<GradeIcon />}
      />

      {/* Selectors */}
      <div className="flex gap-4 flex-wrap">
        <FormControl size="small" sx={{ minWidth: 240 }} disabled={enrollLoading}>
          <InputLabel>Course</InputLabel>
          <Select
            value={courseId}
            label="Course"
            onChange={(e: SelectChangeEvent) => handleCourseChange(e.target.value)}
          >
            <MenuItem value="" disabled><em>Select a course…</em></MenuItem>
            {enrollments.map((e) => (
              <MenuItem key={e.courseId} value={e.courseId}>{e.courseName}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 240 }} disabled={!courseId || lessonsLoading}>
          <InputLabel>Lesson</InputLabel>
          <Select
            value={lessonId}
            label="Lesson"
            onChange={(e: SelectChangeEvent) => setLessonId(e.target.value)}
          >
            <MenuItem value="" disabled><em>Select a lesson…</em></MenuItem>
            {lessons.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.title} — {new Date(l.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {/* States */}
      {loading && <Box className="flex justify-center py-10"><CircularProgress /></Box>}

      {!loading && !courseId && (
        <EmptyState icon={<GradeIcon />} title="No course selected." subtitle="Use the dropdown above to choose a course." />
      )}
      {!loading && courseId && !lessonId && (
        <EmptyState icon={<GradeIcon />} title="Select a lesson to see your grade." />
      )}

      {/* Grade card */}
      {!loading && courseId && lessonId && (
        selectedGrade ? (
          <Card variant="outlined" sx={{ borderRadius: 2, maxWidth: 560 }}>
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Typography variant="h6" fontWeight={600}>
                  {selectedGrade.lessonTitle}
                </Typography>
                <Chip
                  label={`Overall: ${selectedGrade.overall.toFixed(1)}`}
                  size="small"
                  color={selectedGrade.overall >= 80 ? "success" : selectedGrade.overall >= 60 ? "warning" : "default"}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </div>
              <Divider />
              <div className="flex flex-wrap gap-2">
                {METRIC_KEYS.map((k) => (
                  <Chip
                    key={k}
                    label={`${k.charAt(0).toUpperCase() + k.slice(1)}: ${selectedGrade.metrics[k]}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </div>
              <GradeRadarChart studentName="" data={radarData} color="#EC4899" />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={<SchoolIcon />}
            title="No grade recorded for this lesson yet."
            subtitle="Your teacher will enter grades after the lesson."
          />
        )
      )}
    </div>
  );
}

export default function StudentGradesPage() {
  return (
    <RouteGuard allowedRoles={["student"]}>
      <React.Suspense>
        <StudentGradesPanel />
      </React.Suspense>
    </RouteGuard>
  );
}
