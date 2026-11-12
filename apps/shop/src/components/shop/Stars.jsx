import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** 0–5 stars, filled to the rating (rounded to the nearest half). */
export function Stars({ value = 0, size = "size-3.5", className }) {
  const rounded = Math.round(Number(value) * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rounded} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? "full" : rounded >= i - 0.5 ? "half" : "none";
        return (
          <span key={i} className={cn("relative inline-block", size)}>
            <Star className={cn("absolute inset-0 text-zinc-300", size)} strokeWidth={1.5} />
            {fill !== "none" ? (
              <span className={cn("absolute inset-0 overflow-hidden", fill === "half" ? "w-1/2" : "w-full")}>
                <Star className={cn("fill-black text-black", size)} strokeWidth={1.5} />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

/** Pick a rating 1–5 by clicking a star (review form). */
export function StarPicker({ value, onChange }) {
  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star className={cn("size-5", i <= value ? "fill-black text-black" : "text-zinc-300")} strokeWidth={1.5} />
        </button>
      ))}
    </span>
  );
}
