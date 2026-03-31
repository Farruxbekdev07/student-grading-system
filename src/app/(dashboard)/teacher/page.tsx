"use client";
// app/(dashboard)/teacher/page.tsx

import React from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GroupIcon from "@mui/icons-material/Group";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { useAuth } from "@/hooks/useAuth";

function TeacherDashboard() {
  const { user } = useAuth();
  const router   = useRouter();

  const stats = [
    { icon: <GroupIcon />,          label: "Total Students",   value: "142", color: "#6366F1" },
    { icon: <MenuBookIcon />,       label: "Active Courses",   value: "5",   color: "#EC4899" },
    { icon: <PendingActionsIcon />, label: "Pending Reviews",  value: "18",  color: "#F59E0B" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" fontWeight={700}>
            Teacher Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" className="mt-1">
            Hello, {user?.name}. You have 18 submissions to review.
          </Typography>
        </div>
        <Chip label="Teacher" color="secondary" />
      </div>

      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <Avatar sx={{ bgcolor: s.color, width: 48, height: 48 }}>{s.icon}</Avatar>
                <div>
                  <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* My Courses quick link */}
      <Card sx={{ border: 1, borderColor: "secondary.main", borderStyle: "dashed" }}>
        <CardActionArea onClick={() => router.push("/teacher/courses")} sx={{ p: 1 }}>
          <CardContent className="flex items-center gap-4">
            <Avatar sx={{ bgcolor: "secondary.main", width: 48, height: 48 }}>
              <MenuBookIcon />
            </Avatar>
            <div className="flex-1">
              <Typography variant="h6" fontWeight={600}>My Courses</Typography>
              <Typography variant="body2" color="text.secondary">
                View your assigned courses
              </Typography>
            </div>
            <ArrowForwardIcon color="secondary" />
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
}

export default function TeacherPage() {
  return (
    <RouteGuard allowedRoles={["teacher"]}>
      <TeacherDashboard />
    </RouteGuard>
  );
}
