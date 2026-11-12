import Link from "next/link";

export const metadata = { title: "Page not found" };

// A real 404: the address doesn't match any page or product.
export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-6 pt-24 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Vela Noire</p>
      <h1 className="text-3xl">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-sm text-zinc-600">
        The piece or page you&apos;re looking for may have moved or is no longer available.
      </p>
      <div className="mt-2 flex gap-6">
        <Link href="/shop" className="underline transition-colors duration-300 hover:text-gray-500">
          Browse the collections
        </Link>
        <Link href="/" className="underline transition-colors duration-300 hover:text-gray-500">
          Home
        </Link>
      </div>
    </section>
  );
}
