"use client";
import Image from "next/image";
import logo from "../../../public/logo.png";
import {
  HandbagIcon,
  Heart,
  User2,
  UserRoundCheck,
  Sparkles,
  Layers,
  Watch,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";


export default function Navbar() {
  const [MenuState, setMenuState] = useState(false);
  const menuRef = useRef(null); // the sliding menu panel
  const toggleRef = useRef(null); // the Menu / Close button (it toggles by itself)

  // Close the menu when the user clicks anywhere else on the screen
  useEffect(() => {
    if (!MenuState) return;
    const handleClickOutside = (e) => {
      const insideMenu = menuRef.current?.contains(e.target);
      const onToggle = toggleRef.current?.contains(e.target);
      if (!insideMenu && !onToggle) setMenuState(false);
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [MenuState]);
  // Phase 3 wires this to the Java JWT login. Until then everyone is a guest.
  const isAuthenticated = false;
  const loading = false;

  const menuItems = [
    { label: "New & featured", path: "/new", icon: Sparkles },
    { label: "Our Collections", path: "/men", icon: Layers },
    { label: "Accessories", path: "/collections", icon: Watch },
  ];

  return (
    <div className="fixed funnel   w-full z-50">
      {/* Desktop Navbar */}
      <nav className="grid grid-cols-3  fixed w-full z-50 bg-white backdrop-blur-3xl items-center justify-between h-fit !py-2 !px-5 text-blue-950 transition-all duration-400">
        {/* menu button manager */}
        <div
          ref={toggleRef}
          onClick={() => setMenuState(!MenuState)}
          className="w-fit h-fit px-2 py-2 flex flex-col cursor-pointer"
        >
          {!MenuState ? (
            <p className=" text-black">Menu</p>
          ) : (
            <p className=" text-black">Close</p>
          )}
        </div>

        <div className="flex items-center justify-center">
          <Link href={"/"}>
            <Image src={logo} className="w-40" alt="Brand logo" />
          </Link>
        </div>

        <div className="flex items-center gap-5 justify-end">
          <p className="text-xs underline font-semibold tracking-wide">
            Help now?
          </p>
          <Link href={"/"}>
            <Heart className="w-4 h-4" />
          </Link>

          {/* User icon — switches based on auth state */}
          {!loading && (
            <Link href={isAuthenticated ? "/MyVn" : "/login"}>
              {isAuthenticated ? (
                <UserRoundCheck className="w-4 h-4" />
              ) : (
                <User2 className="w-4 h-4" />
              )}
            </Link>
          )}

          <Link href={"/"}>
            <HandbagIcon className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* menu dropdown with Framer Motion */}
      <AnimatePresence>
        {MenuState && (
          <motion.div
            ref={menuRef}
            initial={{ x: -100, opacity: 0 }} // Start off-screen to the left
            animate={{ x: 0, opacity: 1 }} // Slide into view
            exit={{ x: -100, opacity: 0 }} // Slide back to the left on close
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative top-15 left-1 w-auto max-w-xs h-fit !py-5 !px-3 rounded-md z-50 bg-white backdrop-blur-3xl"
          >
            <ul className="flex flex-col gap-2">
              {menuItems.map(({ label, path, icon: Icon }) => (
                <li key={path} className="relative group list-none">
                  <Link
                    href={path}
                    onClick={() => setMenuState(false)} // Close menu on click
                    className="block !px-2 rounded-md transition-all duration-300 flex items-center justify-between !py-2 text-sm  tracking-wider
                    bg-zinc-100 hover:bg-black hover:text-white"
                  >
                    {label}
                    <Icon className="size-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
