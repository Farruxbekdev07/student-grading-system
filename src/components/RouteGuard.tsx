"use client";
// components/RouteGuard.tsx
// -------------------------------------------------
// Decision: Client-side guard as a safety net.
// Middleware handles server-side redirect; this guard
// handles cases where client-side navigation bypasses
// middleware (e.g., direct link to /admin as a student).
// -------------------------------------------------

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { useAppSelector } from "@/store";
import { selectUser, selectLoading } from "@/store/slices/authSlice";
import { UserRole } from "@/types/user";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const router  = useRouter();
  const user    = useAppSelector(selectUser);
  const loading = useAppSelector(selectLoading);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their own dashboard if they try to access wrong role
      router.replace(`/${user.role}`);
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
