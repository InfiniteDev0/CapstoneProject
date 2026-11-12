"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A scrolling list whose items scale in as they come into view, with a fade at
 * whichever edge has more to scroll to (from Barista).
 *
 * Keyboard: the arrow keys move the selection, Enter opens the selected item
 * (so does a double-click on it) and Delete (or Backspace) removes it.
 */
export function AnimatedList({
  items,
  getKey,
  renderItem,
  onItemSelect,
  onItemRemove,
  gradientClassName,
  className,
  listClassName,
  itemClassName,
  "aria-label": ariaLabel,
}) {
  const listRef = useRef(null);
  const [selected, setSelected] = useState(-1);
  const [fade, setFade] = useState({ top: false, bottom: false });

  const updateFade = () => {
    const list = listRef.current;
    if (!list) return;
    setFade({
      top: list.scrollTop > 4,
      bottom: list.scrollTop + list.clientHeight < list.scrollHeight - 4,
    });
  };

  // Items come and go (cleared): keep the fades and selection honest
  useEffect(() => {
    updateFade();
    setSelected((index) => Math.min(index, items.length - 1));
  }, [items.length]);

  const select = (index) => {
    setSelected(index);
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const onKeyDown = (event) => {
    // Only the list's own keys, not ones typed into something inside an item
    if (event.target !== event.currentTarget) return;
    const item = items[selected];
    if (event.key === "ArrowDown") {
      event.preventDefault();
      select(Math.min(selected + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      select(Math.max(selected - 1, 0));
    } else if (event.key === "Enter" && item) {
      event.preventDefault();
      onItemSelect?.(item);
    } else if ((event.key === "Delete" || event.key === "Backspace") && item) {
      event.preventDefault();
      onItemRemove?.(item);
    }
  };

  return (
    <div className={cn("relative flex flex-col", className)}>
      <ul
        ref={listRef}
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onScroll={updateFade}
        className={cn("scrollbar-pill min-h-0 flex-1 overflow-y-auto outline-none", listClassName)}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={getKey(item)}
            index={index}
            root={listRef}
            onPointerEnter={() => setSelected(index)}
            onDoubleClick={onItemSelect ? () => onItemSelect(item) : undefined}
            className={itemClassName}
          >
            {renderItem(item, index === selected)}
          </AnimatedItem>
        ))}
      </ul>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-10 bg-linear-to-b to-transparent transition-opacity duration-300",
          gradientClassName,
          fade.top ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t to-transparent transition-opacity duration-300",
          gradientClassName,
          fade.bottom ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function AnimatedItem({ children, index, root, onPointerEnter, onDoubleClick, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { root, amount: 0.3 });

  return (
    <motion.li
      ref={ref}
      data-index={index}
      onPointerEnter={onPointerEnter}
      // A double-click on the card opens it, as Enter does; not one on a button or link inside it
      onDoubleClick={(event) => {
        if (event.target.closest("button, a, input, textarea, select")) return;
        onDoubleClick?.();
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.li>
  );
}
