"use client";

import { Toaster as Sonner } from "sonner";

/**
 * The one and only toast container for the app.
 * Mounted once in the root layout. Every toast in the app uses this style.
 */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      theme="light"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "font-sans rounded-none border border-black/10 shadow-lg",
          title: "tracking-wide",
        },
      }}
    />
  );
}
