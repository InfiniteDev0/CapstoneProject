import { Bell, DollarSign, LayoutGrid, ShieldAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const metadata = { title: "Dashboard" };

// The four numbers the capstone spec asks for. Phase 7 fills them from the Java API.
const kpis = [
  { title: "Total sales", icon: DollarSign, hint: "All completed orders" },
  { title: "Active users", icon: Users, hint: "Shopped in the last 30 days" },
  { title: "Churn rate", icon: ShieldAlert, hint: "Customers predicted to leave" },
  { title: "Top category", icon: LayoutGrid, hint: "By revenue" },
];

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Hi there, VN Admin</h1>
          <p className="text-sm text-muted-foreground">Here is how Vela Noire is doing.</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              className="relative cursor-pointer rounded-full border p-2 hover:bg-zinc-100"
            >
              <Bell className="size-4" />
              <span className="absolute right-1 top-0 size-[5px] rounded-full bg-black" />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>You have no notifications.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <Button type="button">Mark all as read</Button>
              <SheetClose asChild>
                <Button variant="outline">Clear all notifications</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ title, icon: Icon, hint }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardDescription>{title}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl tabular-nums">—</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Sales charts and churn insights will appear here once the kitchen (Java) and the smart waiter (Python) are open.
      </div>
    </div>
  );
}
