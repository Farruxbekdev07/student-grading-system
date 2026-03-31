// lib/muiTheme.ts
// -------------------------------------------------
// Decision: Build the MUI theme as a factory function
// that accepts the current mode. This lets our Redux
// themeSlice drive the theme without any prop drilling.
// -------------------------------------------------

import { createTheme, Theme, PaletteMode } from "@mui/material/styles";

export const buildMuiTheme = (mode: PaletteMode): Theme =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#6366F1",       // Indigo 500
        light: "#818CF8",
        dark: "#4F46E5",
        contrastText: "#fff",
      },
      secondary: {
        main: "#EC4899",       // Pink 500
        light: "#F472B6",
        dark: "#DB2777",
        contrastText: "#fff",
      },
      background: {
        default: mode === "dark" ? "#0F172A" : "#F8FAFC",
        paper:   mode === "dark" ? "#1E293B" : "#FFFFFF",
      },
      text: {
        primary:   mode === "dark" ? "#F1F5F9" : "#0F172A",
        secondary: mode === "dark" ? "#94A3B8" : "#64748B",
      },
      error:   { main: "#EF4444" },
      warning: { main: "#F59E0B" },
      success: { main: "#10B981" },
      info:    { main: "#3B82F6" },
    },
    typography: {
      fontFamily: "var(--font-inter), system-ui, sans-serif",
      h1: { fontWeight: 800, letterSpacing: "-0.025em" },
      h2: { fontWeight: 700, letterSpacing: "-0.02em"  },
      h3: { fontWeight: 700, letterSpacing: "-0.015em" },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    shape: { borderRadius: 10 },
    shadows: [
      "none",
      "0 1px 3px rgba(0,0,0,0.08)",
      "0 4px 6px rgba(0,0,0,0.07)",
      "0 10px 15px rgba(0,0,0,0.07)",
      "0 20px 25px rgba(0,0,0,0.07)",
      ...Array(20).fill("none"),
    ] as Theme["shadows"],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: "10px 20px",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined", size: "small" },
        styleOverrides: {
          root: { "& .MuiOutlinedInput-root": { borderRadius: 8 } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          // Smooth dark/light transitions
          body: { transition: "background-color 0.2s ease, color 0.2s ease" },
        },
      },
    },
  });
