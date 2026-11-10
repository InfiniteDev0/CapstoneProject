import Link from "next/link";

export const metadata = { title: "Coming soon" };

// Shown for any page we have not built yet (product, cart, collections…).
export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-6 pt-24 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Vela Noire</p>
      <h1 className="text-3xl">This page is being crafted</h1>
      <p className="max-w-md text-sm text-zinc-600">
        Like every Vela Noire piece, it takes time to get right. Please come back soon.
      </p>
      <Link href="/" className="mt-2 underline transition-colors duration-300 hover:text-gray-500">
        Return to the home page
      </Link>
    </section>
  );
}
