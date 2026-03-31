"use client";
// components/layout/Navbar.tsx
// v2: minimal top bar — brand, theme toggle, user avatar + logout.
// Navigation lives in Sidebar; Navbar is branding/utility only.

import React from "react";
import AppBar       from "@mui/material/AppBar";
import Toolbar      from "@mui/material/Toolbar";
import Typography   from "@mui/material/Typography";
import IconButton   from "@mui/material/IconButton";
import Avatar       from "@mui/material/Avatar";
import Tooltip      from "@mui/material/Tooltip";
import Button       from "@mui/material/Button";
import DarkModeIcon  from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon    from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { useAuth }   from "@/hooks/useAuth";
import { useTheme }  from "@/hooks/useTheme";

export function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("")
    : "?";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider", zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {/* Brand */}
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ flexGrow: 1 }}>
          MyApp
        </Typography>

        {/* Theme toggle */}
        <IconButton onClick={toggle} size="small" title="Toggle theme">
          {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>

        {/* Profile avatar */}
        {user && (
          <Tooltip title={`${user.name} · Edit profile`}>
            <IconButton size="small" onClick={() => router.push("/profile")} sx={{ p: 0 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 13, fontWeight: 700 }}>
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
        )}

        {/* Logout */}
        {user && (
          <Button onClick={logout} startIcon={<LogoutIcon />} size="small" color="inherit" variant="outlined">
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
