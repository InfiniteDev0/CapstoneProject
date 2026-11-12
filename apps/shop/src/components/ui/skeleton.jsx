import { cn } from "@/lib/utils";

/** A soft pulsing block that holds a place while content loads. */
export function Skeleton({ className, ...props }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-zinc-100", className)} {...props} />;
}
