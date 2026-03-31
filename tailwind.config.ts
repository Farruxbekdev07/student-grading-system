import type { Config } from "tailwindcss";

const config: Config = {
  // Scope Tailwind only to our source files
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // IMPORTANT: darkMode 'class' lets us toggle via a class on <html>
  // This syncs with MUI's dark mode via our themeSlice
  darkMode: "class",
  theme: {
    extend: {
      // Mirror MUI breakpoints so both systems stay in sync
      screens: {
        xs: "0px",
        sm: "600px",
        md: "900px",
        lg: "1200px",
        xl: "1536px",
      },
      colors: {
        primary: {
          main: "#6366F1",    // Indigo — matches MUI theme
          light: "#818CF8",
          dark: "#4F46E5",
        },
        secondary: {
          main: "#EC4899",
          light: "#F472B6",
          dark: "#DB2777",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
  // Prevent Tailwind from conflicting with MUI's CSS baseline
  corePlugins: {
    preflight: false,
  },
};

export default config;
