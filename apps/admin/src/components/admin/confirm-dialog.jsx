"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * "Are you sure?" before something you can't undo (delete a product, cancel an order).
 *   <ConfirmDialog open={open} onOpenChange={setOpen} title="Delete product?" confirmLabel="Delete" danger onConfirm={doIt} />
 */
export function ConfirmDialog({ open, onOpenChange, title, message, confirmLabel = "Confirm", danger = false, onConfirm }) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // the API client already showed the reason
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent showCloseButton={false} className="rounded-lg border-0 ring-0 sm:max-w-sm">
        <DialogTitle>{title}</DialogTitle>
        {message ? <DialogDescription>{message}</DialogDescription> : null}
        <DialogFooter className="border-0 bg-transparent">
          <button type="button" disabled={busy} onClick={() => onOpenChange(false)} className="h-9 rounded-md bg-muted px-4 text-sm hover:bg-accent">
            Keep it
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className={cn("h-9 rounded-md px-4 text-sm text-white disabled:opacity-50", danger ? "bg-red-600 hover:bg-red-700" : "bg-foreground text-background hover:opacity-90")}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
