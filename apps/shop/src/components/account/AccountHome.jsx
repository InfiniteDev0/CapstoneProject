"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { notify } from "@/lib/toast";

/** My Vela Noire (Part A: who you are and sign out; Part B adds profile, orders and devices). */
export default function AccountHome() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const signOut = () => {
    logout();
    notify.success("Signed out");
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28">
      <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">My Vela Noire</p>
      {loading || !user ? (
        <div className="mt-2 space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <>
          <h1 className="text-3xl">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {user.email} · Member since {formatDate(user.createdAt, { month: "long", year: "numeric" })}
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Link href="/account/wishlist" className="rounded-md bg-zinc-100 p-5 transition-colors hover:bg-zinc-200">
              <p className="text-sm font-medium">Wishlist</p>
              <p className="text-xs text-zinc-500">The pieces you&apos;ve saved</p>
            </Link>
            <Link href="/shop" className="rounded-md bg-zinc-100 p-5 transition-colors hover:bg-zinc-200">
              <p className="text-sm font-medium">Continue shopping</p>
              <p className="text-xs text-zinc-500">Browse the collections</p>
            </Link>
          </div>
          <button type="button" onClick={signOut} className="mt-10 text-sm underline underline-offset-4 hover:text-zinc-500">
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
