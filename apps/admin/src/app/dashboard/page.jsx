import { DollarSign, LayoutGrid, ShieldAlert, Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export const metadata = { title: "Dashboard" };

// The four numbers the capstone spec asks for. Phase 7 fills them from the Java API
// (GET /api/admin/dashboard/stats); until then they show a dash.
const stats = [
  {
    id: "sales",
    badge: "Total sales",
    icon: DollarSign,
    value: "—",
    caption: "All completed orders",
    tone: "green",
    action: { label: "Orders", href: "/dashboard/orders" },
  },
  {
    id: "active",
    badge: "Active users",
    icon: Users,
    value: "—",
    caption: "Logged in during the last 30 days",
    tone: "blue",
    action: { label: "Customers", href: "/dashboard/customers" },
  },
  {
    id: "churn",
    badge: "Churn rate",
    icon: ShieldAlert,
    value: "—",
    caption: "Customers predicted to leave",
    tone: "red",
    action: { label: "Churn Risk", href: "/dashboard/churn" },
  },
  {
    id: "category",
    badge: "Top category",
    icon: LayoutGrid,
    value: "—",
    caption: "By revenue",
    tone: "violet",
    action: { label: "Products", href: "/dashboard/products" },
  },
];

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Hi there, VN Admin</h1>
        <p className="text-sm text-muted-foreground">Here is how Vela Noire is doing.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ id, ...stat }) => (
          <StatCard key={id} {...stat} />
        ))}
      </div>

      <div className="flex min-h-64 flex-1 items-center justify-center rounded-lg bg-card/60 p-10 text-center text-sm text-muted-foreground">
        Sales charts and churn insights will appear here once the kitchen (Java) and the smart waiter (Python) are open.
      </div>
    </div>
  );
}
