import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata = { title: "Checkout" };

// Protected by src/proxy.js: guests are sent to /login first.
export default function CheckoutPage() {
  return <CheckoutView />;
}
