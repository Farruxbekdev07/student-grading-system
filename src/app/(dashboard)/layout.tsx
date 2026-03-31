// app/(dashboard)/layout.tsx
// v2: adds Sidebar alongside the main content area.
// Navbar sits at the top; Sidebar + main fill the rest of the viewport.

import { Navbar }  from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

