"use client";
// components/layout/Sidebar.tsx
// -------------------------------------------------
// Fixed left sidebar. Role-aware — renders the correct
// nav links based on the current user's role from Redux.
// Active link is highlighted using Next.js usePathname.
// Width: 220px on desktop, hidden on mobile (drawer TBD).
// -------------------------------------------------

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";

import DashboardIcon       from "@mui/icons-material/Dashboard";
import SchoolIcon          from "@mui/icons-material/School";
import MenuBookIcon        from "@mui/icons-material/MenuBook";
import GradingIcon         from "@mui/icons-material/Grading";
import BarChartIcon        from "@mui/icons-material/BarChart";
import PeopleAltIcon       from "@mui/icons-material/PeopleAlt";
import HowToRegIcon        from "@mui/icons-material/HowToReg";
import PersonIcon          from "@mui/icons-material/Person";

import { useAppSelector } from "@/store";
import { selectUser }     from "@/store/slices/authSlice";

interface NavItem {
  label: string;
  href:  string;
  icon:  React.ReactNode;
  // match: if pathname starts with this prefix, mark active
  // defaults to exact href match
  matchPrefix?: string;
}

const TEACHER_NAV: NavItem[] = [
  { label: "Dashboard",  href: "/teacher",           icon: <DashboardIcon fontSize="small" /> },
  { label: "Courses",    href: "/teacher/courses",   icon: <SchoolIcon    fontSize="small" />, matchPrefix: "/teacher/course" },
  { label: "Lessons",    href: "/teacher/lessons",   icon: <MenuBookIcon  fontSize="small" /> },
  { label: "Grades",     href: "/teacher/grades",    icon: <GradingIcon   fontSize="small" /> },
  { label: "Analytics",  href: "/teacher/analytics", icon: <BarChartIcon  fontSize="small" /> },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard",   href: "/admin",              icon: <DashboardIcon fontSize="small" /> },
  { label: "Users",       href: "/admin/users",        icon: <PeopleAltIcon fontSize="small" /> },
  { label: "Courses",     href: "/admin/courses",      icon: <SchoolIcon    fontSize="small" /> },
  { label: "Enrollments", href: "/admin/enrollments",  icon: <HowToRegIcon  fontSize="small" /> },
];

const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard",  href: "/student",          icon: <DashboardIcon fontSize="small" /> },
  { label: "My Courses", href: "/student/courses",  icon: <SchoolIcon    fontSize="small" />, matchPrefix: "/student/course" },
  { label: "My Lessons", href: "/student/lessons",  icon: <MenuBookIcon  fontSize="small" /> },
  { label: "My Grades",  href: "/student/grades",   icon: <GradingIcon   fontSize="small" /> },
];

// ─── Single nav item ──────────────────────────────────────────────────────────
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link href={item.href} style={{ textDecoration: "none" }}>
      <div
        className={[
          "flex items-center gap-3 px-3 py-2 rounded-lg mx-2 transition-colors cursor-pointer",
          active
            ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        ].join(" ")}
      >
        <span className={active ? "text-indigo-600 dark:text-indigo-400" : ""}>
          {item.icon}
        </span>
        <Typography
          variant="body2"
          fontWeight={active ? 600 : 400}
          sx={{ color: "inherit" }}
        >
          {item.label}
        </Typography>
      </div>
    </Link>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const user     = useAppSelector(selectUser);

  if (!user) return null;

  const navItems =
    user.role === "admin"   ? ADMIN_NAV   :
    user.role === "teacher" ? TEACHER_NAV :
    STUDENT_NAV;

  const roleLabel =
    user.role === "admin"   ? "Admin"   :
    user.role === "teacher" ? "Teacher" :
    "Student";

  function isActive(item: NavItem): boolean {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    // Dashboard: exact match only (avoid matching /teacher/courses as /teacher)
    if (item.href.split("/").length === 2) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 border-r border-slate-200 dark:border-slate-700"
      style={{ width: 220, minHeight: "100vh", paddingTop: 16, paddingBottom: 24 }}
    >
      {/* Role badge */}
      <div className="px-5 pb-3">
        <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
          {roleLabel}
        </Typography>
      </div>

      <Divider sx={{ mx: 2, mb: 1 }} />

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 mt-1 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item)} />
        ))}
      </nav>

      <Divider sx={{ mx: 2, mb: 1 }} />

      {/* Profile link */}
      <NavLink
        item={{ label: "Profile", href: "/profile", icon: <PersonIcon fontSize="small" /> }}
        active={pathname === "/profile"}
      />
    </aside>
  );
}
