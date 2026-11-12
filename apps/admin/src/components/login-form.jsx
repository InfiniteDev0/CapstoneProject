"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/components/providers/admin-auth";
import { notify } from "@/lib/toast";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [problem, setProblem] = useState("");

  const wanted = params.get("redirect") || "/dashboard";
  const redirect = wanted.startsWith("/dashboard") ? wanted : "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setProblem("");
    try {
      const user = await login(email.trim(), password);
      notify.success(`Welcome back, ${user.name.split(" ")[0]}`);
      router.replace(redirect);
      router.refresh();
    } catch (err) {
      // Wrong password: the API client already showed Java's message. A customer account: say so here.
      if (err?.status === 403) {
        setProblem(err.message);
        notify.error(err.message);
      } else if (err?.status === 401) {
        setProblem("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className={"bg-black text-white"}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back Admin</CardTitle>
          <CardDescription>Login to see your ecommerce dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Admin Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@velanoire.local"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={"border-gray-700"}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Admin Password</FieldLabel>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={"*******"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className={"border-gray-700"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              {problem ? (
                <p role="alert" className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200">
                  {problem}
                </p>
              ) : null}

              <Field>
                <Button className={"bg-white text-black"} type="submit" disabled={loading}>
                  {loading ? "Signing in…" : "Continue to dashboard"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
