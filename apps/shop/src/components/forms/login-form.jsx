"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { notify } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

// Schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const LoginForm = ({ initialMode = "login" }) => {
  const [formType, setFormType] = useState(initialMode); // "login" | "register"
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only go back to pages on this site (never to an outside link)
  const wanted = searchParams.get("redirect") || "/";
  const redirect = wanted.startsWith("/") && !wanted.startsWith("//") ? wanted : "/";

  const isLogin = formType === "login";
  const schema = isLogin ? loginSchema : registerSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
    },
  });

  // Reset form when switching modes
  const switchMode = (mode) => {
    setFormType(mode);
    form.reset();
  };

  // The order tablet already shows Java's message as a toast if this fails (e.g. wrong password)
  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (isLogin) {
        const user = await login(values.email.trim(), values.password);
        notify.success(`Welcome back, ${user.name.split(" ")[0]}`);
      } else {
        const user = await register({
          name: `${values.firstName.trim()} ${values.lastName.trim()}`,
          email: values.email.trim(),
          password: values.password,
        });
        notify.success(`Welcome to Vela Noire, ${user.name.split(" ")[0]}`);
      }
      router.replace(redirect);
      router.refresh();
    } catch {
      // toast already shown
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[450px] font-semibold space-y-2 py-6">
      {/* Header */}
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isLogin ? "Welcome back" : "Create your free account"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isLogin
            ? "Sign in to your Vela Noire account"
            : "Join our community and be part of the movement"}
        </p>
      </div>

      <div className="h-4" />

      {/* Main Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 font-semibold"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={"font-semibold"}>Email</FormLabel>
                <FormControl>
                  <Input placeholder="johnmiller@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name fields — only shown when registering */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={"font-semibold"}>
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Amira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={"font-semibold"}>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Hassan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={"font-semibold"}>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full font-semibold text-base"
            disabled={submitting}
          >
            {submitting
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>
      </Form>

      {/* Footer Info */}
      <div className="space-y-4">
        <p className="text-muted-foreground text-center text-xs leading-relaxed px-4">
          By continuing, you agree to Vela Noire&apos;s{" "}
          <Link
            href="#"
            className="underline underline-offset-4 text-foreground hover:text-primary transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and our{" "}
          <Link
            href="#"
            className="underline underline-offset-4 text-foreground  hover:text-primary transition-colors"
          >
            Privacy Policy.
          </Link>
        </p>

        <p className="text-muted-foreground text-center text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            className="text-primary underline font-semibold cursor-pointer hover:underline"
            onClick={() => switchMode(isLogin ? "register" : "login")}
          >
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
