import Image from "next/image";
import Link from "next/link";

/**
 * AuthShell: the sign-in / sign-up frame (layout idea from the Barista project).
 *
 *  Desktop → 50/50 split: form on the left, brand photograph on the right.
 *  Phones  → the form only, full screen.
 *
 * Always dark: the `dark` class switches this page to the theme's dark palette
 * (see `.dark` in globals.css), so the shadcn inputs and buttons follow along.
 *
 * The page is pinned to the screen. If the form grows taller than the screen
 * (the register form has more fields), the form column scrolls, not the page.
 */
export default function AuthShell({ children }) {
  return (
    <div className="dark h-svh overflow-hidden bg-background text-foreground [color-scheme:dark] lg:grid lg:grid-cols-2 lg:gap-2 lg:p-2">
      {/* ── Left: form ────────────────────────────────────── */}
      <section className="flex h-full flex-col gap-4 p-6 lg:p-10">
        {/* Phones only: the photo (and its logo) is hidden, so show the logo here */}
        <header className="shrink-0 lg:hidden">
          <Link href="/" aria-label="Vela Noire home" className="block w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" className="w-30 invert" alt="Vela Noire" />
          </Link>
        </header>

        {/* m-auto centres the form while it fits, and pins it to the top when it doesn't */}
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="m-auto w-full max-w-md">{children}</div>
        </div>

        <footer className="shrink-0 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vela Noire. All rights reserved.
        </footer>
      </section>

      {/* ── Right: photograph (desktop only) ──────────────── */}
      <section className="relative hidden overflow-hidden rounded-lg bg-black lg:block">
        <Image
          src="/auth.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-[center_30%]"
        />
        {/* Darken the top and bottom edges so the white logo and text stay readable */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30" />

        <Link href="/" aria-label="Vela Noire home" className="absolute right-8 top-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" className="w-36 invert" alt="Vela Noire" />
        </Link>

        <div className="absolute inset-x-8 bottom-8 text-right text-white">
          <p className="text-6xl font-light tracking-tight xl:text-8xl">Vela Noire</p>
          <p className="mt-2 text-base text-white/80">Luxury Reimagined for Her</p>
        </div>
      </section>
    </div>
  );
}
