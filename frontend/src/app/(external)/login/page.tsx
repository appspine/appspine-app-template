"use client";

import { useState, useTransition } from "react";

import { useTranslations } from "@appspine/frontend-shell";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "@/server/auth-actions";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await login(values.email, values.password);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  }

  const emailError = errors.email;
  const passwordError = errors.password
    ? {
        ...errors.password,
        message: t("passwordRequired"),
      }
    : undefined;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{t("signIn")}</CardTitle>
          <CardDescription>{t("signInDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                <FieldError errors={[emailError]} />
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
                <FieldError errors={[passwordError]} />
              </Field>
              {formError && <FieldError>{formError}</FieldError>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t("signingIn") : t("signIn")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
