import { Suspense } from "react";
import AuthShell from "@/components/shared/AuthShell";
import LoginForm from "@/components/forms/login-form";

export const metadata = { title: "Create account" };

export default function Page() {
  return (
    <AuthShell>
      {/* useSearchParams in the form needs a Suspense boundary */}
      <Suspense fallback={null}>
        <LoginForm initialMode="register" />
      </Suspense>
    </AuthShell>
  );
}
