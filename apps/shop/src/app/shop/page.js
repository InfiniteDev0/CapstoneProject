import { Suspense } from "react";
import ShopBrowser from "@/components/shop/ShopBrowser";

export const metadata = { title: "Shop" };

// The browser reads its filters from the URL, so it waits for the URL inside Suspense.
export default function ShopPage() {
  return (
    <Suspense>
      <ShopBrowser />
    </Suspense>
  );
}
