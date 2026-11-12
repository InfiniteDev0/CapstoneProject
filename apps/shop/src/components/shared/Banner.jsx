"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Message shown in the black strip at the top, per page
const bannerContent = {
  "/": "Free Shipping & Return on All Orders Above 75$",
  "/men": "Shop the latest in Men’s luxury wear. Free shipping on all orders above $75!",
  "/women": "Discover our Women’s collection. Enjoy exclusive offers and free returns!",
  "/collections": "Explore our curated Collections.",
};

export default function Banner() {
  const pathname = usePathname();
  const message = bannerContent[pathname];
  if (!message) return null;

  return (
    <div
      className="bg-black flex items-center justify-center text-white !py-2 w-full z-[60]"
      style={{ position: "sticky", top: 0 }}
    >
      <div className="flex text-[11.5px] tracking-wider gap-1 items-center justify-center">
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
