import Image from "next/image";

/**
 * Loader: full-screen brand loader shown while a page is loading.
 * Use <Loader inline /> inside a section instead of covering the screen.
 */
export default function Loader({ inline = false, label = "Loading" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        inline
          ? "flex w-full flex-col items-center justify-center gap-4 py-16"
          : "fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-white"
      }
    >
      <Image src="/logo.png" alt="Vela Noire" width={160} height={60} priority className="animate-pulse" />
      <div className="relative h-px w-32 overflow-hidden bg-black/10">
        <span className="absolute inset-y-0 left-0 w-1/3 animate-[vn-slide_1.2s_ease-in-out_infinite] bg-black" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
