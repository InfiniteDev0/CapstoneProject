"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useKeyShortcut } from "@/hooks/use-key-shortcut";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "vn-admin-theme";

/**
 * Light / dark switch (from Barista's top bar). Puts the "dark" class on <html>,
 * which swaps every colour token in globals.css, and remembers the choice.
 * D toggles it from anywhere (only the copy with `shortcut` listens).
 */
export function ThemeToggle({ className, shortcut = false }) {
  const [dark, setDark] = useState(false);

  // Read the theme the head script already applied
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // private window: the switch still works, it just isn't remembered
    }
    setDark(next);
  };

  useKeyShortcut("d", toggle, { enabled: shortcut });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-keyshortcuts={shortcut ? "D" : undefined}
          className={cn("flex items-center justify-center", className)}
        >
          {dark ? <Sun /> : <Moon />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{dark ? "Light mode" : "Dark mode"}{shortcut ? " · D" : ""}</TooltipContent>
    </Tooltip>
  );
}
