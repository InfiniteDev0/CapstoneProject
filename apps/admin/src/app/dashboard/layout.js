import { AdminShell } from "@/components/admin-shell";

// Phase 4 adds the guard here: no valid admin JWT → redirect("/login").
export default function DashboardLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
