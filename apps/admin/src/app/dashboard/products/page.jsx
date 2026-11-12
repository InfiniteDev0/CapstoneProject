import { PageHeader } from "@/components/admin/ui-bits";
import { ProductsTable } from "@/components/admin/products-table";

export const metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader title="Products" description="Every piece in the catalogue, in any status. Click a row to edit it." />
      <ProductsTable />
    </>
  );
}
