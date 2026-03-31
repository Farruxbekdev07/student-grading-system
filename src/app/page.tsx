// app/page.tsx
// Simple root redirect — middleware handles auth-aware routing
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}
