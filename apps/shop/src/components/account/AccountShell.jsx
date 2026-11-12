"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
];

/** My Vela Noire: greeting, tabs, sign out. The page under it changes with the tab. */
export default function AccountShell({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const signOut = () => {
    logout();
    notify.success("Signed out");
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">My Vela Noire</p>
          {user ? <h1 className="text-3xl">Welcome, {user.name.split(" ")[0]}</h1> : <Skeleton className="mt-1 h-9 w-56" />}
        </div>
        <button type="button" onClick={signOut} className="text-sm underline underline-offset-4 hover:text-zinc-500">
          Sign out
        </button>
      </div>

      <nav className="mb-10 mt-8 flex gap-1 overflow-x-auto" aria-label="Account sections">
        {TABS.map((t) => {
          const active = t.href === "/account" ? pathname === "/account" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn("rounded-full px-4 py-2 text-sm transition-colors", active ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
