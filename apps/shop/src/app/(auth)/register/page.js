import { Suspense } from "react";
import LoginForm from "@/components/forms/login-form";

export const metadata = { title: "Create account" };

export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" className="w-30" alt="Vela Noire" />
        {/* useSearchParams in the form needs a Suspense boundary */}
        <Suspense fallback={null}>
          <LoginForm initialMode="register" />
        </Suspense>
      </div>
    </div>
  );
}
