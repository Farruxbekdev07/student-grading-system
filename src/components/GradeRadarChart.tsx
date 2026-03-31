"use client";
// components/GradeRadarChart.tsx
// -------------------------------------------------
// Reusable Recharts radar chart for grade metrics.
// Used by both the teacher analytics page and the
// student grades page — kept here to avoid duplication.
// Recharts is already in the project as it's a common
// companion to MUI — add to package.json if absent:
//   npm install recharts
// -------------------------------------------------

import React from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Typography from "@mui/material/Typography";
import { RadarDataPoint } from "@/types/grade";

interface GradeRadarChartProps {
  studentName: string;
  data:        RadarDataPoint[];
  color?:      string;
}

export function GradeRadarChart({
  studentName,
  data,
  color = "#6366F1",
}: GradeRadarChartProps) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <Typography variant="subtitle1" fontWeight={600} textAlign="center">
        {studentName}
      </Typography>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="var(--mui-palette-divider, #e0e0e0)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 12, fill: "var(--mui-palette-text-secondary, #666)" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name={studentName}
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 4, fill: color }}
          />
          <Tooltip
            formatter={(value: number) => [`${value}`, ""]}
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Helper: convert a Grade/GradeRow into RadarDataPoint[] ──────────────────
export function gradeToRadarData(metrics: {
  listening: number;
  reading:   number;
  speaking:  number;
  writing:   number;
  interest:  number;
}): RadarDataPoint[] {
  return [
    { metric: "Listening", value: metrics.listening, full: 100 },
    { metric: "Reading",   value: metrics.reading,   full: 100 },
    { metric: "Speaking",  value: metrics.speaking,  full: 100 },
    { metric: "Writing",   value: metrics.writing,   full: 100 },
    { metric: "Interest",  value: metrics.interest,  full: 100 },
  ];
}
