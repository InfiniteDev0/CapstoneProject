"use client";

import { useEffect, useRef } from "react";
import { Eye, Trash2 } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

// Swiping notification cards (from Barista).
//   Phones:    SwipeNotification: swipe right to clear, left to open.
//   Computers: SwipeReveal: drag left to show Clear, right to show Open;
//              drag most of the way (or fast) and it's done straight away.

/** How far (px) a card must be swiped, either way, to count on a phone. */
const SWIPE_AT = 96;
/** How far a card slides to show its Clear or Open button on a computer. */
const REVEAL = 88;
const SNAP = { type: "spring", stiffness: 500, damping: 40 };

const UNDER = "absolute inset-0 flex items-center gap-2 rounded-lg text-[0.8125rem] font-bold text-white";
const REVEAL_BUTTON =
  "flex w-[4.75rem] flex-col items-center justify-center gap-1 rounded-lg text-[0.8125rem] font-bold text-white outline-none focus-visible:ring-3";

/** Letting go of a drag also fires a click on the card; this swallows it. */
function useDragGuard() {
  const dragged = useRef(false);
  return {
    dragged,
    handlers: {
      onPointerDownCapture: () => {
        dragged.current = false;
      },
      onDragStart: () => {
        dragged.current = true;
      },
    },
  };
}

export function SwipeNotification({ onClear, onOpen, children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const clearOpacity = useTransform(x, [0, 24, SWIPE_AT], [0, 0, 1]);
  const openOpacity = useTransform(x, [-SWIPE_AT, -24, 0], [1, 0, 0]);
  const { dragged, handlers } = useDragGuard();

  const away = async (to, then) => {
    await animate(x, to, { duration: 0.2, ease: "easeIn" });
    then();
  };

  return (
    <div ref={ref} className="relative">
      <motion.div aria-hidden style={{ opacity: clearOpacity }} className={cn(UNDER, "bg-red-500 ps-6")}>
        <Trash2 className="size-5" />
        Clear
      </motion.div>
      <motion.div aria-hidden style={{ opacity: openOpacity }} className={cn(UNDER, "justify-end bg-blue-500 pe-6")}>
        <Eye className="size-5" />
        Open
      </motion.div>

      <motion.div
        style={{ x }}
        drag="x"
        dragElastic={0.1}
        dragMomentum={false}
        {...handlers}
        onDragEnd={(_, info) => {
          const at = x.get();
          const width = ref.current?.offsetWidth ?? 400;
          if (at > SWIPE_AT || (info.velocity.x > 800 && at > SWIPE_AT / 2)) {
            void away(width + 40, onClear);
          } else if (at < -SWIPE_AT || (info.velocity.x < -800 && at < -SWIPE_AT / 2)) {
            void away(-width - 40, () => {
              onOpen();
              x.set(0); // back in place for when the sheet opens again
            });
          } else {
            animate(x, 0, SNAP);
          }
        }}
        onClickCapture={(event) => {
          if (!dragged.current) return;
          event.preventDefault();
          event.stopPropagation();
          dragged.current = false;
        }}
        className="cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Like an iPhone notification: drag a card left and a Clear button slides out on
 * its right; drag it right and an Open button slides out on its left. Clicking a
 * slid-open card closes it again. Only one card is open at a time (`revealed`).
 */
export function SwipeReveal({ revealed, onRevealChange, onClear, onOpen, children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const clearOpacity = useTransform(x, [-REVEAL, -24, 0], [1, 0, 0]);
  const openOpacity = useTransform(x, [0, 24, REVEAL], [0, 0, 1]);
  const { dragged, handlers } = useDragGuard();

  // Opening another card closes this one
  useEffect(() => {
    const controls = animate(x, revealed === "clear" ? -REVEAL : revealed === "open" ? REVEAL : 0, SNAP);
    return () => controls.stop();
  }, [revealed, x]);

  const clear = async () => {
    const width = ref.current?.offsetWidth ?? 400;
    await animate(x, -width - 40, { duration: 0.2, ease: "easeIn" });
    onClear();
  };

  return (
    <div ref={ref} className="relative">
      <div className="absolute inset-y-0 left-0 flex w-[5.5rem] justify-start">
        <motion.button
          type="button"
          style={{ opacity: openOpacity }}
          tabIndex={revealed === "open" ? 0 : -1}
          aria-hidden={revealed !== "open"}
          onClick={() => {
            onRevealChange(null);
            onOpen();
          }}
          className={cn(REVEAL_BUTTON, "bg-blue-500 focus-visible:ring-blue-500/30")}
        >
          <Eye className="size-5" />
          Open
        </motion.button>
      </div>
      <div className="absolute inset-y-0 right-0 flex w-[5.5rem] justify-end">
        <motion.button
          type="button"
          style={{ opacity: clearOpacity }}
          tabIndex={revealed === "clear" ? 0 : -1}
          aria-hidden={revealed !== "clear"}
          onClick={() => void clear()}
          className={cn(REVEAL_BUTTON, "bg-red-500 focus-visible:ring-red-500/30")}
        >
          <Trash2 className="size-5" />
          Clear
        </motion.button>
      </div>

      <motion.div
        style={{ x }}
        drag="x"
        dragElastic={0.1}
        dragMomentum={false}
        {...handlers}
        onDragEnd={(_, info) => {
          const at = x.get();
          const width = ref.current?.offsetWidth ?? 400;
          if (at < -width / 2 || (info.velocity.x < -800 && at < -REVEAL / 2)) {
            void clear();
            return;
          }
          if (at > width / 2 || (info.velocity.x > 800 && at > REVEAL / 2)) {
            onRevealChange(null);
            onOpen();
            animate(x, 0, SNAP);
            return;
          }
          const next = at < -REVEAL / 2 ? "clear" : at > REVEAL / 2 ? "open" : null;
          animate(x, next === "clear" ? -REVEAL : next === "open" ? REVEAL : 0, SNAP);
          onRevealChange(next);
        }}
        onClickCapture={(event) => {
          if (dragged.current || revealed) {
            event.preventDefault();
            event.stopPropagation();
            dragged.current = false;
            if (revealed) onRevealChange(null);
          }
        }}
        className="cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}
