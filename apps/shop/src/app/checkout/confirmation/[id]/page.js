import OrderConfirmation from "@/components/checkout/OrderConfirmation";

export const metadata = { title: "Order confirmed" };

export default async function ConfirmationPage({ params }) {
  const { id } = await params;
  return <OrderConfirmation id={id} />;
}
