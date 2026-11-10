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
import { Separator } from "@/components/ui/separator";
import Link from "next/link";


// Phase 3 replaces previewAuth with real calls to the Java API (POST /api/auth/login, /api/auth/register).
const previewAuth = {
  login: async () => ({ error: { message: "Preview mode: sign in goes live in Phase 3." } }),
  register: async () => ({ error: { message: "Preview mode: sign up goes live in Phase 3." } }),
  loginWithGoogle: async () => notify.info("Google sign-in is not part of the capstone yet."),
};

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
  const { login, register, loginWithGoogle } = previewAuth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

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

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (isLogin) {
        const res = await login({
          email: values.email,
          password: values.password,
        });
        if (res?.error) {
          notify.error(
            res.error.message || "Login failed. Please check your credentials.",
          );
        } else {
          notify.success("Welcome back!");
          router.push(redirect);
        }
      } else {
        const name = `${values.firstName} ${values.lastName}`.trim();
        const res = await register({
          name,
          email: values.email,
          password: values.password,
        });
        if (res?.error) {
          notify.error(
            res.error.message || "Registration failed. Please try again.",
          );
        } else {
          notify.success("Account created! Welcome to Vela Noire.");
          router.push(redirect);
        }
      }
    } catch (err) {
      notify.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch {
      notify.error("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-[450px] font-semibold space-y-2 py-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isLogin ? "Welcome back" : "Create your free account"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isLogin
            ? "Sign in to your Vela Noire account"
            : "Join our community and be part of the movement"}
        </p>
      </div>

      {/* Google CTA */}
      <Button
        variant="outline"
        className="w-full font-semibold"
        type="button"
        onClick={handleGoogle}
        disabled={submitting}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">Or</span>
        </div>
      </div>

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
