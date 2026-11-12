"use client";

import { useEffect, useState } from "react";
import { Laptop, Smartphone, Tablet } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorState } from "@/components/shop/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import { GENDER_LABELS } from "@/lib/labels";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

const DEVICE_ICONS = { DESKTOP: Laptop, MOBILE: Smartphone, TABLET: Tablet };

/**
 * Profile: the demographics and preferences the spec asks for (name, phone, country,
 * gender, date of birth, preferred categories), plus member since, devices and totals.
 * These same facts are what the churn model learns from in Phase 6.
 */
export default function ProfileView() {
  const profile = useApi("/api/user/me");
  const categories = useApi("/api/store/categories");

  if (profile.error) return <ErrorState onRetry={profile.reload} />;
  if (profile.loading || !profile.data) return <ProfileSkeleton />;
  const p = profile.data;

  return (
    <div className="space-y-12">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Member since" value={formatDate(p.createdAt, { month: "short", year: "numeric" })} hint={`${p.tenureDays} days with us`} />
        <Stat label="Orders" value={p.orderCount} />
        <Stat label="Total spent" value={formatPrice(p.totalSpent)} />
        <Stat label="Devices" value={p.deviceCount} />
      </dl>

      <ProfileForm profile={p} categories={categories.data ?? []} onSaved={(next) => profile.setData(next)} />

      <section className="space-y-4">
        <h2 className="text-lg">My devices</h2>
        {p.devices.length === 0 ? (
          <p className="text-sm text-zinc-500">No devices recorded yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {p.devices.map((d, i) => {
              const Icon = DEVICE_ICONS[d.deviceType] ?? Laptop;
              return (
                <li key={i} className="flex items-center gap-4 py-3 text-sm">
                  <span className="flex size-10 items-center justify-center rounded-full bg-zinc-100">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p>{[d.browser, d.os].filter(Boolean).join(" on ") || d.deviceType.toLowerCase()}</p>
                    <p className="text-xs text-zinc-500">First seen {formatDate(d.firstSeen)}</p>
                  </div>
                  <p className="text-xs text-zinc-500">Last used {formatDate(d.lastSeen)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProfileForm({ profile, categories, onSaved }) {
  const { setUser } = useAuth();
  const [form, setForm] = useState(() => toForm(profile));
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(toForm(profile)), [profile]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleCategory = (slug) =>
    setForm((f) => ({
      ...f,
      preferredCategories: f.preferredCategories.includes(slug) ? f.preferredCategories.filter((s) => s !== slug) : [...f.preferredCategories, slug],
    }));

  const save = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return notify.error("Please enter your name");
    setSaving(true);
    try {
      const next = await api("/api/user/me", {
        method: "PATCH",
        body: {
          name: form.name.trim(),
          phone: form.phone,
          country: form.country,
          city: form.city,
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          preferredCategories: form.preferredCategories,
        },
      });
      onSaved(next);
      setUser((u) => (u ? { ...u, name: next.name } : u)); // the navbar greets the new name
      notify.success("Your details are saved");
    } catch {
      // toast already shown
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <h2 className="text-lg">My details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" value={form.name} onChange={set("name")} autoComplete="name" />
        <Input label="Email" value={profile.email} disabled />
        <Input label="Phone" value={form.phone} onChange={set("phone")} autoComplete="tel" />
        <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} max={new Date().toISOString().slice(0, 10)} />
        <Input label="Country" value={form.country} onChange={set("country")} autoComplete="country-name" />
        <Input label="City" value={form.city} onChange={set("city")} autoComplete="address-level2" />
        <label className="space-y-1.5 text-sm">
          <span className="block">Gender</span>
          <select value={form.gender} onChange={set("gender")} className="h-11 w-full rounded-md bg-zinc-100 px-3 outline-none">
            <option value="">Not set</option>
            {Object.entries(GENDER_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm">What do you love? <span className="text-xs text-zinc-500">We use this to personalise your shop.</span></p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = form.preferredCategories.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggleCategory(c.slug)}
                aria-pressed={on}
                className={cn("rounded-full px-4 py-2 text-sm transition-colors", on ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200")}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" disabled={saving} className="h-11 rounded-md bg-black px-6 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-50">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function toForm(p) {
  return {
    name: p.name ?? "",
    phone: p.phone ?? "",
    country: p.country ?? "",
    city: p.city ?? "",
    gender: p.gender ?? "",
    dateOfBirth: p.dateOfBirth ?? "",
    preferredCategories: p.preferredCategories ?? [],
  };
}

function Input({ label, className, ...props }) {
  return (
    <label className={cn("space-y-1.5 text-sm", className)}>
      <span className="block">{label}</span>
      <input {...props} className="h-11 w-full rounded-md bg-zinc-100 px-3 outline-none focus:bg-zinc-200/70 disabled:text-zinc-500" />
    </label>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-md bg-zinc-50 p-4">
      <dt className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</dt>
      <dd className="mt-1 text-xl">{value}</dd>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11" />)}</div>
    </div>
  );
}
