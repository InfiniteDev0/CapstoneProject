import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Badge and number colours per tone (from Barista). Neutral keeps an outline badge. */
export const STAT_TONES = {
  neutral: { badge: "", value: "text-neutral-950 dark:text-neutral-50" },
  blue: { badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300", value: "text-blue-600 dark:text-blue-400" },
  violet: { badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300", value: "text-violet-600 dark:text-violet-400" },
  sky: { badge: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300", value: "text-sky-600 dark:text-sky-400" },
  green: { badge: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300", value: "text-green-600 dark:text-green-400" },
  orange: { badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300", value: "text-orange-600 dark:text-orange-400" },
  teal: { badge: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300", value: "text-teal-600 dark:text-teal-400" },
  red: { badge: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300", value: "text-red-600 dark:text-red-400" },
};

const CARD = "flex h-28 flex-col items-start justify-between rounded-lg bg-card p-3";

/** A card's shape while its figure loads: the pill, the number and the caption line. */
export function StatCardSkeleton() {
  const bar = "animate-pulse rounded-full bg-neutral-200/80 dark:bg-neutral-800";
  return (
    <div aria-hidden className={CARD}>
      <span className={cn(bar, "h-7 w-32")} />
      <div className="w-full">
        <span className={cn(bar, "block h-7 w-24 rounded-md")} />
        <span className={cn(bar, "mt-2 block h-3 w-40")} />
      </div>
    </div>
  );
}

/**
 * A figure card: a coloured badge at the top, the number and a one-line caption
 * at the bottom. With `action`, a click anywhere on it opens the page behind it.
 *
 *   <StatCard badge="Total sales" icon={DollarSign} value="$200.00" caption="..." tone="green"
 *             action={{ label: "Orders", href: "/dashboard/orders" }} />
 */
export function StatCard({ badge, icon: Icon, value, caption, tone = "neutral", action }) {
  const colours = STAT_TONES[tone];
  const body = (
    <>
      <Badge
        variant={tone === "neutral" ? "outline" : "default"}
        className={cn("h-7 gap-2 px-2.5 text-[0.875rem] [&>svg]:size-3.5!", colours.badge)}
      >
        <Icon />
        {badge}
        {action ? <ArrowUpRight /> : null}
      </Badge>
      <div className="max-w-full min-w-0">
        <p className={cn("truncate text-3xl leading-none font-semibold tabular-nums", colours.value)}>{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{caption}</p>
      </div>
    </>
  );
  return action ? (
    <Link
      href={action.href}
      aria-label={`${badge}: open ${action.label}`}
      className={cn(CARD, "ring-foreground/10 transition-shadow outline-none hover:ring-2 focus-visible:ring-2")}
    >
      {body}
    </Link>
  ) : (
    <div className={CARD}>{body}</div>
  );
}
