"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/ui-bits";
import { useAdminAuth } from "@/components/providers/admin-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { useApi } from "@/hooks/use-api";
import { API_URL, SHOP_URL } from "@/lib/api";
import { notify } from "@/lib/toast";

/** Your account, the connection to the kitchen, and the look of the admin. */
export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAdminAuth();
  const health = useApi("/api/health");

  const signOut = () => {
    logout();
    notify.success("Signed out");
    router.replace("/login");
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Your account">
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={user?.name} />
            <Row label="Email" value={user?.email} />
            <Row label="Role" value={user?.role} />
          </dl>
          <button type="button" onClick={signOut} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-muted px-3 text-sm hover:bg-accent">
            <LogOut className="size-4" /> Sign out
          </button>
        </Panel>

        <Panel title="Connection">
          <dl className="space-y-2 text-sm">
            <Row label="API" value={API_URL} />
            <Row label="Status" value={health.loading ? "Checking…" : health.data ? `${health.data.status} · MySQL ${health.data.mysql} · MongoDB ${health.data.mongodb}` : "Not reachable"} />
            <Row label="Shop" value={<a href={SHOP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">{SHOP_URL} <ExternalLink className="size-3" /></a>} />
          </dl>
          <a href={`${API_URL}/swagger-ui.html`} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-muted px-3 text-sm hover:bg-accent">
            <ExternalLink className="size-4" /> Open the API docs (Swagger)
          </a>
        </Panel>

        <Panel title="Appearance">
          <div className="flex items-center justify-between text-sm">
            <span>Light / dark mode <span className="text-muted-foreground">(or press D)</span></span>
            <ThemeToggle className="size-9 rounded-md bg-muted hover:bg-accent [&_svg]:size-4" />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right">{value ?? "—"}</dd>
    </div>
  );
}
