import Link from "next/link";
import { cn } from "@/lib/utils";

/** Nothing to show (no results, empty bag...). Calm and on-brand. */
export function EmptyState({ title, message, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-20 text-center", className)}>
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Vela Noire</p>
      <h2 className="text-xl">{title}</h2>
      {message ? <p className="max-w-sm text-sm text-zinc-500">{message}</p> : null}
      {action ? (
        <Link href={action.href} className="mt-2 text-sm underline underline-offset-4 transition-colors hover:text-zinc-500">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Something went wrong loading (API down, network...). Offers a retry. */
export function ErrorState({ message, onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-20 text-center", className)}>
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">A small interruption</p>
      <h2 className="text-xl">We couldn&apos;t load this right now</h2>
      <p className="max-w-sm text-sm text-zinc-500">
        {message || "The atelier is not answering. Please check your connection and try again."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-sm underline underline-offset-4 transition-colors hover:text-zinc-500"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

/** A section title in the house style: small caps eyebrow, then the heading. */
export function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">{eyebrow}</p> : null}
        <h2 className="text-2xl">{title}</h2>
      </div>
      {action ? (
        <Link href={action.href} className="text-sm underline underline-offset-4 transition-colors hover:text-zinc-500">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
