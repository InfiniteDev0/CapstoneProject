import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#ebebeb] p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center">
          <Image src="/logo.png" width={200} height={75} alt="Vela Noire" priority />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
