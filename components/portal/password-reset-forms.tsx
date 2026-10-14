"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations";
import { AuthCard } from "./auth-card";
import { FieldLabel, FormMessage, PasswordInput } from "./form-field";

const submitClass =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-bright-blue px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-blue disabled:cursor-not-allowed disabled:opacity-70";
const linkClass = "font-semibold text-primary-blue underline dark:text-bright-blue";

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  async function onSubmit(data: ForgotPasswordInput) {
    setError(null);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <p role="status" className="text-sm leading-relaxed text-muted dark:text-slate-400">
          If an account exists for that email, we&apos;ve sent a link to reset your password. The link expires in 30 minutes.
        </p>
        <p className="mt-6 text-sm">
          <Link href="/login" className={linkClass}>Back to sign in</Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your registered email and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" aria-label="Request a password reset">
        <div>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input id="email" type="email" icon={Mail} autoComplete="email" error={errors.email?.message} {...register("email")} />
        </div>
        <button type="submit" disabled={isSubmitting} className={submitClass}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
        <FormMessage>{error}</FormMessage>
        <p className="text-center text-sm">
          <Link href="/login" className={linkClass}>Back to sign in</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<React.ReactNode>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });

  async function onSubmit(data: ResetPasswordInput) {
    setError(null);
    try {
      await authApi.resetPassword(token, data.password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError && (err.code === "INVALID_TOKEN" || err.code === "VALIDATION_ERROR") ? (
          <>
            This reset link is invalid or has expired.{" "}
            <Link href="/forgot-password" className="underline">Request a new one</Link>
          </>
        ) : (
          errorMessage(err)
        ),
      );
    }
  }

  if (!token) {
    return (
      <AuthCard title="Reset link missing">
        <p className="text-sm text-muted dark:text-slate-400">Open the link from your email, or request a new one.</p>
        <p className="mt-6 text-sm"><Link href="/forgot-password" className={linkClass}>Request a reset link</Link></p>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password updated">
        <p role="status" className="text-sm text-muted dark:text-slate-400">
          Your password has been changed and you&apos;ve been signed out everywhere. Sign in with your new password.
        </p>
        <p className="mt-6 text-sm"><Link href="/login" className={linkClass}>Sign in</Link></p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" aria-label="Reset password">
        <div>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register("password")} />
        </div>
        <div>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <PasswordInput id="confirmPassword" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        </div>
        <button type="submit" disabled={isSubmitting} className={submitClass}>
          {isSubmitting ? "Saving..." : "Update password"}
        </button>
        <FormMessage>{error}</FormMessage>
      </form>
    </AuthCard>
  );
}
