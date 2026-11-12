import { PageHeader } from "@/components/admin/ui-bits";
import { ProductsTable } from "@/components/admin/products-table";
import { titleCase } from "@/lib/format";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: titleCase(slug) };
}

/** One collection's products (same table, filtered). */
export default async function CollectionPage({ params }) {
  const { slug } = await params;
  return (
    <>
      <PageHeader title={titleCase(slug)} description="Products in this collection." back={{ href: "/dashboard/collections", label: "Collections" }} />
      <ProductsTable collection={slug} />
    </>
  );
}
