import ProductView from "@/components/product/ProductView";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** The browser tab shows the product's name (asked from the kitchen on the server). */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/api/store/products/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const p = await res.json();
      return { title: p.name, description: p.description };
    }
  } catch {
    // fall through to the default title
  }
  return { title: "Product" };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
