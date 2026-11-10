"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Message shown in the black strip at the top, per page
const bannerContent = {
  "/": "Free Shipping & Returns on All Orders Above $75",
  "/collections": "Explore curated Collections. Limited-time deals available now!",
  "/new": "Discover new arrivals and trending styles. Shop now!",
  "/gifts": "Perfect Gifts for every occasion. Free gift wrapping on all orders!",
  "/sale": "Big Sale! Up to 50% off select items. Don’t miss out!",
};

export default function Banner() {
  const pathname = usePathname();
  const message = bannerContent[pathname];
  if (!message) return null;

  return (
    <div className="flex w-full items-center justify-center bg-black px-4 py-2 text-white">
      <div className="flex flex-wrap items-center justify-center gap-1 text-center text-[11.5px] tracking-wider">
        <span>{message}</span>
        <p className="ml-2 tracking-wider">
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="font-bold underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
