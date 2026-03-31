"use client";
// components/layout/PageHeader.tsx
// -------------------------------------------------
// Consistent page header used on every page.
// Props:
//   title       — h5 heading
//   subtitle    — muted caption below (optional)
//   icon        — MUI icon to the left of title (optional)
//   actions     — right-side slot for buttons (optional)
//   backHref    — if set, renders a back arrow (optional)
//   backLabel   — tooltip text for back arrow
// -------------------------------------------------

import React from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title:      string;
  subtitle?:  string;
  icon?:      React.ReactNode;
  actions?:   React.ReactNode;
  backHref?:  string;
  backLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  backHref,
  backLabel = "Go back",
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        {backHref && (
          <Tooltip title={backLabel}>
            <IconButton size="small" onClick={() => router.push(backHref)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {icon && (
          <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
        )}
        <div>
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
