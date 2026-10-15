"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, Loader2, LogIn, ShieldCheck, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { errorMessage } from "@/components/common/error-state";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { safeRedirectPath, useAuth } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"));
  const { user, isLoading, login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { username: "", password: "" } });
  const { register, handleSubmit, formState } = form;

  React.useEffect(() => {
    if (!isLoading && user) router.replace(next);
  }, [isLoading, user, next, router]);

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.username.trim(), values.password);
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(70%_70%_at_30%_30%,black,transparent)]" />
        <div aria-hidden className="animate-float absolute -right-20 top-24 size-80 rounded-full bg-coral/90 shadow-[0_30px_90px_-20px_rgb(255_122_89/0.7)]" />
        <div aria-hidden className="animate-float-slow absolute right-52 top-[26rem] size-32 rounded-full bg-periwinkle" />
        <div aria-hidden className="animate-float-slow absolute -bottom-24 -right-10 size-96 rounded-full bg-white/90" />

        <Logo tone="light" size="lg" className="relative" />

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
            Your people,
            <br />
            beautifully organised.
          </h2>
          <ul className="mt-8 space-y-4 text-[15px] text-white/85">
            {[
              [Users, "One directory for every employee, searchable in an instant"],
              [BarChart3, "A live dashboard of headcount, hiring and departments"],
              [ShieldCheck, "Secure sign-in with CSRF-protected sessions"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Users;
              return (
                <li key={text as string} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur">
                    <I className="size-[18px]" />
                  </span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-sm text-white/55">Employee management, made simple.</p>
      </section>

      {/* Form */}
      <section className="bg-app grid place-items-center px-4 py-10">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>
          <div className="rounded-2xl border border-border/80 bg-surface p-7 shadow-lift">
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with your administrator account to manage employees.</p>
            <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
              {error && (
                <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
                  {error}
                </p>
              )}
              <Field id="username" label="Username" error={formState.errors.username?.message}>
                {(aria) => <Input {...aria} {...register("username")} autoComplete="username" autoFocus />}
              </Field>
              <Field id="password" label="Password" error={formState.errors.password?.message}>
                {(aria) => <Input {...aria} {...register("password")} type="password" autoComplete="current-password" />}
              </Field>
              <Button type="submit" size="lg" disabled={formState.isSubmitting} className="mt-1">
                {formState.isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
                Sign in
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
