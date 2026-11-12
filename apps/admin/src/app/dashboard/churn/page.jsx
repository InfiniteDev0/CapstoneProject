"use client";

import { PageHeader } from "@/components/admin/ui-bits";
import { Phase7Panel } from "@/components/admin/phase7-empty";

/** Customers likely to stop shopping (HIGH / MEDIUM / LOW). Filled by the churn model in Phase 7. */
export default function ChurnPage() {
  return (
    <>
      <PageHeader title="Churn Risk" description="Customers the AI thinks may stop shopping, and win-back discounts to send them." />
      <Phase7Panel
        endpoint="/api/admin/churn"
        title="No churn predictions yet"
        message="Once the smart waiter (Python) is trained on order and click history, every customer gets a HIGH, MEDIUM or LOW risk here, and you can send at-risk customers a retention discount."
      >
        {(rows) => <pre className="rounded-lg bg-card p-4 text-xs">{JSON.stringify(rows, null, 2)}</pre>}
      </Phase7Panel>
    </>
  );
}
