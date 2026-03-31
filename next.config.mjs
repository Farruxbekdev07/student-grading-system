/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode catches hydration issues early in development
  reactStrictMode: true,

  // Transpile MUI packages for App Router compatibility
  transpilePackages: ["@mui/material", "@mui/icons-material"],

  experimental: {
    // Optimise CSS layer ordering (prevents MUI/Tailwind conflicts)
    optimizeCss: false,
  },
};

export default nextConfig;
