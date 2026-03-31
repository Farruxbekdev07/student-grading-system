// app/(auth)/layout.tsx
// Route group layout for login & register pages.
// No navbar here — clean auth experience.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-main/10 via-transparent to-secondary-main/10 p-4">
      {children}
    </main>
  );
}
