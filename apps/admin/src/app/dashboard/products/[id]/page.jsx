"use client";

import { use } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";

export default function EditProductPage({ params }) {
  const { id } = use(params);
  const { data, loading, error, reload } = useApi(`/api/admin/products/${id}`);

  if (loading) return <TableSkeleton rows={8} />;
  if (error?.status === 404) {
    return (
      <>
        <PageHeader title="Product not found" back={{ href: "/dashboard/products", label: "Products" }} />
        <EmptyState title="This product doesn't exist" message="It may have been deleted." />
      </>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return <ProductForm product={data} />;
}
