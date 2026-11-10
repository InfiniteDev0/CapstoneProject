"use client";

import { ArrowUp} from "lucide-react";
import React from "react";

const ScrollingAnimations = () => {
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <button
      onClick={handleScrollTop}
      className="bg-white border border-black flex items-center justify-center w-10 h-10 rounded-full fixed left-3 bottom-3 z-[9999] shadow-lg text-black hover:bg-zinc-300 transition-colors"
      aria-label="Scroll to top"
    >
      <ArrowUp className="size-5" />
    </button>
  );
};

export default ScrollingAnimations;
