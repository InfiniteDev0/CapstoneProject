"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Gem,
  Gift,
  HandbagIcon,
  Heart,
  Layers,
  PartyPopper,
  Sparkles,
  Tag,
  User2,
  Watch,
  Wine,
} from "lucide-react";

const menuItems = [
  { label: "New & featured", path: "/new", icon: Sparkles },
  { label: "Our Collections", path: "/collections", icon: Layers },
  { label: "Rare Collectibles", path: "/collections/rare-collectibles", icon: Gem },
  { label: "Accessories", path: "/accessories", icon: Watch },
  { label: "Sales and Deals", path: "/sale", icon: Tag },
  { label: "VN Saloon", path: "/discover", icon: Wine },
  { label: "Gifts and personalization", path: "/gifts", icon: Gift },
  { label: "The VN Gala", path: "/gala", icon: PartyPopper },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Phase 3 wires this to the Java JWT login. Until then everyone is a guest.
  const isAuthenticated = false;

  return (
    <div className="sticky top-0 z-50 w-full">
      <nav className="grid h-fit w-full grid-cols-3 items-center bg-white/95 px-5 py-2 text-blue-950 backdrop-blur-3xl">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          className="w-fit cursor-pointer px-2 py-2 text-left text-black"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <div className="flex items-center justify-center">
          <Link href="/" aria-label="Vela Noire home">
            <Image src="/logo.png" alt="Vela Noire" width={160} height={60} priority className="w-40" />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-5">
          <Link href="/help" className="hidden text-xs font-semibold tracking-wide underline sm:block">
            Help now?
          </Link>
          <Link href="/wishlist" aria-label="Wishlist">
            <Heart className="size-4" />
          </Link>
          <Link href={isAuthenticated ? "/account" : "/login"} aria-label="Account">
            <User2 className="size-4" />
          </Link>
          <Link href="/cart" aria-label="Shopping bag">
            <HandbagIcon className="size-4" />
          </Link>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute left-1 top-full mt-1 h-fit w-auto max-w-xs rounded-md bg-white px-3 py-5 shadow-lg"
          >
            <ul className="flex flex-col gap-2">
              {menuItems.map(({ label, path, icon: Icon }) => (
                <li key={path} className="group relative list-none">
                  <Link
                    href={path}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-md bg-zinc-100 px-2 py-2 text-sm tracking-wider transition-all duration-300 hover:bg-black hover:text-white"
                  >
                    {label}
                    <Icon className="size-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
