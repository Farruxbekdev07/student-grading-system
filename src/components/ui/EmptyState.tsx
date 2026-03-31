"use client";
// components/ui/EmptyState.tsx

import React from "react";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

interface EmptyStateProps {
  icon?:     React.ReactNode;
  title:     string;
  subtitle?: string;
  action?:   React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
        {icon && (
          <span style={{ fontSize: 44, opacity: 0.3 }}>{icon}</span>
        )}
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.disabled">
            {subtitle}
          </Typography>
        )}
        {action}
      </div>
    </Paper>
  );
}
