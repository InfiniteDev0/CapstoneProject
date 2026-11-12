"use client";

import { Sparkles } from "lucide-react";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";

/**
 * A page that already asks Java for its data (so the wiring is done), but shows a calm
 * "activates in Phase 7" state while the smart waiter (Python) doesn't exist yet.
 */
export function Phase7Panel({ endpoint, title, message, children }) {
  const { data, loading, error, reload } = useApi(endpoint);
  if (loading) return <TableSkeleton rows={4} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState icon={Sparkles} title={title} message={message}>
        <span className="mt-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Activates in Phase 7</span>
      </EmptyState>
    );
  }
  return children(data);
}
