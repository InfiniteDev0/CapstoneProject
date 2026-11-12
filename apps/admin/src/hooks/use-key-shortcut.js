"use client";

import { useEffect, useRef } from "react";

/**
 * Run `handler` when `key` is pressed anywhere, except while typing in a field.
 * With `ctrl`, it needs Ctrl (or Cmd on a Mac), and works inside fields too.
 */
export function useKeyShortcut(key, handler, { enabled = true, ctrl = false } = {}) {
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event) => {
      if (event.key.toLowerCase() !== key) return;
      const withCtrl = event.ctrlKey || event.metaKey;
      if (ctrl !== withCtrl || event.altKey) return;
      const el = event.target;
      const typing = el?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el?.tagName);
      if (typing && !ctrl) return;
      event.preventDefault();
      saved.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, ctrl, enabled]);
}
