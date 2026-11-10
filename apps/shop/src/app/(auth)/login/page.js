import { Suspense } from "react";
import AuthShell from "@/components/shared/AuthShell";
import LoginForm from "@/components/forms/login-form";

export const metadata = { title: "Sign in" };

export default function Page() {
  return (
    <AuthShell>
      {/* useSearchParams in the form needs a Suspense boundary */}
      <Suspense fallback={null}>
        <LoginForm initialMode="login" />
      </Suspense>
    </AuthShell>
  );
}
