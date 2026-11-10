import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/forms/login-form";

export const metadata = { title: "Create account" };

export default function Page() {
  return (
    <div className="relative flex items-center justify-center h-screen w-screen">
      {/* Brand logo in the top-left corner, links back home */}
      <Link href="/" aria-label="Vela Noire home" className="absolute left-6 top-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" className="w-30" alt="Vela Noire" />
      </Link>
      <div>
        {/* useSearchParams in the form needs a Suspense boundary */}
        <Suspense fallback={null}>
          <LoginForm initialMode="register" />
        </Suspense>
      </div>
    </div>
  );
}
