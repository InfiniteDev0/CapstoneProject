"use client";

import { PageHeader } from "@/components/admin/ui-bits";
import { Phase7Panel } from "@/components/admin/phase7-empty";

/** How good the AI models are. Filled in Phase 7. */
export default function ModelsPage() {
  return (
    <>
      <PageHeader title="Model Health" description="Accuracy, precision, recall and ROC-AUC for churn; Precision@K for recommendations." />
      <Phase7Panel
        endpoint="/api/admin/model-metrics"
        title="No model scores yet"
        message="After the churn model and the recommender are trained in Phase 6, their test scores are saved and shown here, so you can see how far to trust the predictions."
      >
        {(rows) => <pre className="rounded-lg bg-card p-4 text-xs">{JSON.stringify(rows, null, 2)}</pre>}
      </Phase7Panel>
    </>
  );
}
