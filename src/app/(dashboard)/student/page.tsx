"use client";
// app/(dashboard)/student/page.tsx

import React from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GradeIcon from "@mui/icons-material/Grade";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { useAuth } from "@/hooks/useAuth";

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
        <div>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const router   = useRouter();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" fontWeight={700}>
            Welcome back, {user?.name} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" className="mt-1">
            Here&apos;s what&apos;s happening with your courses today.
          </Typography>
        </div>
        <Chip label="Student" color="primary" />
      </div>

      {/* Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<SchoolIcon />}
            label="Enrolled Courses"
            value="6"
            color="#6366F1"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<AssignmentIcon />}
            label="Assignments Due"
            value="3"
            color="#EC4899"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<GradeIcon />}
            label="Average Grade"
            value="87%"
            color="#10B981"
          />
        </Grid>
      </Grid>

      {/* My Courses quick link */}
      <Card sx={{ border: 1, borderColor: "primary.main", borderStyle: "dashed" }}>
        <CardActionArea onClick={() => router.push("/student/courses")} sx={{ p: 1 }}>
          <CardContent className="flex items-center gap-4">
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              <SchoolIcon />
            </Avatar>
            <div className="flex-1">
              <Typography variant="h6" fontWeight={600}>My Courses</Typography>
              <Typography variant="body2" color="text.secondary">
                View your enrolled courses
              </Typography>
            </div>
            <ArrowForwardIcon color="primary" />
          </CardContent>
        </CardActionArea>
      </Card>

      {/* My Lessons quick link */}
      <Card sx={{ border: 1, borderColor: "secondary.main", borderStyle: "dashed" }}>
        <CardActionArea onClick={() => router.push("/student/lessons")} sx={{ p: 1 }}>
          <CardContent className="flex items-center gap-4">
            <Avatar sx={{ bgcolor: "secondary.main", width: 48, height: 48 }}>
              <MenuBookIcon />
            </Avatar>
            <div className="flex-1">
              <Typography variant="h6" fontWeight={600}>My Lessons</Typography>
              <Typography variant="body2" color="text.secondary">
                View lessons and your grades
              </Typography>
            </div>
            <ArrowForwardIcon color="secondary" />
          </CardContent>
        </CardActionArea>
      </Card>

      {/* My Grades quick link */}
      <Card sx={{ border: 1, borderColor: "success.main", borderStyle: "dashed" }}>
        <CardActionArea onClick={() => router.push("/student/grades")} sx={{ p: 1 }}>
          <CardContent className="flex items-center gap-4">
            <Avatar sx={{ bgcolor: "success.main", width: 48, height: 48 }}>
              <GradeIcon />
            </Avatar>
            <div className="flex-1">
              <Typography variant="h6" fontWeight={600}>My Grades</Typography>
              <Typography variant="body2" color="text.secondary">
                View your scores and performance charts
              </Typography>
            </div>
            <ArrowForwardIcon sx={{ color: "success.main" }} />
          </CardContent>
        </CardActionArea>
      </Card>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <Typography variant="h6" fontWeight={600} gutterBottom>
            My Profile
          </Typography>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography variant="body1" fontWeight={500}>{user?.name}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body1" fontWeight={500}>{user?.email}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">Role</Typography>
              <Typography variant="body1" fontWeight={500} className="capitalize">{user?.role}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">UID</Typography>
              <Typography variant="body2" color="text.secondary" className="font-mono truncate">
                {user?.uid}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap with RouteGuard — only "student" role can access
export default function StudentPage() {
  return (
    <RouteGuard allowedRoles={["student"]}>
      <StudentDashboard />
    </RouteGuard>
  );
}
