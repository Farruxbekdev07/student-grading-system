"use client";
// app/(dashboard)/admin/page.tsx
// Modified: added User Management quick-link card.

import React from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SchoolIcon from "@mui/icons-material/School";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/RouteGuard";
import { useAuth } from "@/hooks/useAuth";

function AdminDashboard() {
  const { user } = useAuth();
  const router   = useRouter();

  const stats = [
    { icon: <PeopleAltIcon />,            label: "Total Users",    value: "1,204", color: "#6366F1" },
    { icon: <SchoolIcon />,               label: "Total Courses",  value: "48",    color: "#10B981" },
    { icon: <AdminPanelSettingsIcon />,   label: "Admins",         value: "3",     color: "#EF4444" },
    { icon: <TrendingUpIcon />,           label: "Active Today",   value: "89",    color: "#F59E0B" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" fontWeight={700}>
            Admin Control Panel
          </Typography>
          <Typography variant="body1" color="text.secondary" className="mt-1">
            Logged in as {user?.name} · Full system access
          </Typography>
        </div>
        <Chip label="Admin" color="error" />
      </div>

      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
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

      <Grid container spacing={3}>
        {/* ── User Management — links to /admin/users ── */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: 1, borderColor: "primary.main", borderStyle: "dashed" }}>
            <CardActionArea onClick={() => router.push("/admin/users")} sx={{ p: 1 }}>
              <CardContent className="flex items-center gap-4">
                <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                  <ManageAccountsIcon />
                </Avatar>
                <div className="flex-1">
                  <Typography variant="h6" fontWeight={600}>User Management</Typography>
                  <Typography variant="body2" color="text.secondary">
                    View all users · assign roles
                  </Typography>
                </div>
                <ArrowForwardIcon color="primary" />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        {/* ── Course Management — links to /admin/courses ── */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: 1, borderColor: "secondary.main", borderStyle: "dashed" }}>
            <CardActionArea onClick={() => router.push("/admin/courses")} sx={{ p: 1 }}>
              <CardContent className="flex items-center gap-4">
                <Avatar sx={{ bgcolor: "secondary.main", width: 48, height: 48 }}>
                  <MenuBookIcon />
                </Avatar>
                <div className="flex-1">
                  <Typography variant="h6" fontWeight={600}>Course Management</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create courses · assign teachers
                  </Typography>
                </div>
                <ArrowForwardIcon color="secondary" />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* ── Enrollment Management — links to /admin/enrollments ── */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: 1, borderColor: "success.main", borderStyle: "dashed" }}>
            <CardActionArea onClick={() => router.push("/admin/enrollments")} sx={{ p: 1 }}>
              <CardContent className="flex items-center gap-4">
                <Avatar sx={{ bgcolor: "success.main", width: 48, height: 48 }}>
                  <HowToRegIcon />
                </Avatar>
                <div className="flex-1">
                  <Typography variant="h6" fontWeight={600}>Enrollment Management</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enroll students · manage course access
                  </Typography>
                </div>
                <ArrowForwardIcon sx={{ color: "success.main" }} />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminDashboard />
    </RouteGuard>
  );
}
