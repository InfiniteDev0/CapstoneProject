"use client";

import { usePathname } from "next/navigation";
import Banner from "@/components/shared/Banner";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

// Pages that show without the shop's banner, navbar and footer
const BARE_ROUTES = ["/login", "/register"];

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((route) => pathname?.startsWith(route));

  if (bare) return children;

  return (
    <>
      <Banner />
      <Navbar />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </>
  );
}
