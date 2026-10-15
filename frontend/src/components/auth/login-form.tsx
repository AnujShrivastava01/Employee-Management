"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { errorMessage } from "@/components/common/error-state";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card className="p-6">
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your administrator account to manage employees.</p>
          <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
            {error && (
              <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Field id="username" label="Username" error={formState.errors.username?.message}>
              {(aria) => <Input {...aria} {...register("username")} autoComplete="username" autoFocus />}
            </Field>
            <Field id="password" label="Password" error={formState.errors.password?.message}>
              {(aria) => <Input {...aria} {...register("password")} type="password" autoComplete="current-password" />}
            </Field>
            <Button type="submit" size="lg" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
