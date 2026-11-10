import Link from "next/link";
import { Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Which phase builds each admin section (see CLAUDE.md)
const comingIn = {
  products: "Phase 4: The wiring",
  collections: "Phase 4: The wiring",
  orders: "Phase 4: The wiring",
  customers: "Phase 7: Waiter meets kitchen",
  churn: "Phase 7: Waiter meets kitchen",
  models: "Phase 7: Waiter meets kitchen",
  settings: "a later phase",
};

function titleCase(slug) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Placeholder for any dashboard section that is not built yet, shown inside the sidebar layout.
export default async function ComingSoonPage({ params }) {
  const { slug } = await params;
  const section = slug[0];
  const name = titleCase(slug[slug.length - 1]);

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-black text-white">
        <Hammer className="size-5" />
      </div>
      <h1 className="text-lg font-medium">{name} is being built</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page arrives in {comingIn[section] ?? "a later phase"}.
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
