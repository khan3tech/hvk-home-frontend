"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MessageSquareText, Phone } from "lucide-react";
import type { AuthResult } from "@/types/api";
import { RegistrationForm } from "@/components/home/registration-form";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { homeFor } from "@/lib/journey";
import { useSession } from "@/lib/session/session-provider";
import {
  loginSchema,
  otpCodeSchema,
  otpPhoneSchema,
  toE164India,
  type LoginInput,
  type OtpCodeInput,
  type OtpPhoneInput,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import { AuthCard } from "./auth-card";
import { FieldLabel, FormMessage, PasswordInput } from "./form-field";

type Mode = "password" | "otp";

const submitClass =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-bright-blue px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-blue disabled:cursor-not-allowed disabled:opacity-70";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const [mode, setMode] = React.useState<Mode>("password");
  const [registrationOpen, setRegistrationOpen] = React.useState(false);
  const next = params.get("next");

  // Already signed in (e.g. back button): go straight to the right place.
  React.useEffect(() => {
    if (session.status === "authenticated" && session.candidate) {
      router.replace(homeFor(session.candidate.role, next));
    }
  }, [session.status, session.candidate, next, router]);

  const onSignedIn = React.useCallback(
    (result: AuthResult) => {
      session.signIn(result);
      router.replace(homeFor(result.candidate.role, next));
    },
    [session, router, next],
  );

  return (
    <AuthCard title="Sign in" subtitle="Continue your registration, payment and exam journey.">
      <div role="tablist" aria-label="Sign-in method" className="mb-6 grid grid-cols-2 rounded-lg bg-light-blue/50 p-1 dark:bg-dark-surface-alt">
        {(["password", "otp"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md py-2 text-sm font-semibold transition-colors",
              mode === m ? "bg-white text-navy shadow-sm dark:bg-dark-surface dark:text-white" : "text-muted hover:text-navy dark:text-slate-400",
            )}
          >
            {m === "password" ? "Password" : "Mobile OTP"}
          </button>
        ))}
      </div>

      {mode === "password" ? <PasswordLogin onSignedIn={onSignedIn} /> : <OtpLogin onSignedIn={onSignedIn} />}

      <p className="mt-6 text-center text-sm text-muted dark:text-slate-400">
        New here?{" "}
        <button type="button" onClick={() => setRegistrationOpen(true)} className="font-semibold text-primary-blue underline dark:text-bright-blue">
          Create an account
        </button>
      </p>
      {registrationOpen ? <RegistrationDialog onClose={() => setRegistrationOpen(false)} /> : null}
    </AuthCard>
  );
}

function RegistrationDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="registration-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-navy/70 dark:bg-dark-surface"
    >
      <RegistrationForm variant="dialog" onClose={onClose} />
    </dialog>
  );
}

function PasswordLogin({ onSignedIn }: { onSignedIn: (r: AuthResult) => void }) {
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { emailOrPhone: "", password: "" } });

  async function onSubmit(data: LoginInput) {
    setError(null);
    try {
      onSignedIn(await authApi.login(toE164India(data.emailOrPhone), data.password));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" aria-label="Sign in with password">
      <div>
        <FieldLabel htmlFor="emailOrPhone">Email or mobile number</FieldLabel>
        <Input id="emailOrPhone" icon={Mail} autoComplete="username" placeholder="you@example.com or 98XXXXXXXX" error={errors.emailOrPhone?.message} {...register("emailOrPhone")} />
      </div>
      <div>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <PasswordInput id="password" autoComplete="current-password" placeholder="Your password" error={errors.password?.message} {...register("password")} />
      </div>
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-semibold text-primary-blue hover:underline dark:text-bright-blue">
          Forgot password?
        </Link>
      </div>
      <button type="submit" disabled={isSubmitting} className={submitClass}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
      <FormMessage>{error}</FormMessage>
    </form>
  );
}

const RESEND_SECONDS = 60;

function OtpLogin({ onSignedIn }: { onSignedIn: (r: AuthResult) => void }) {
  const [challenge, setChallenge] = React.useState<{ id: string; phone: string } | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const phoneForm = useForm<OtpPhoneInput>({ resolver: zodResolver(otpPhoneSchema), defaultValues: { phone: "" } });
  const codeForm = useForm<OtpCodeInput>({ resolver: zodResolver(otpCodeSchema), defaultValues: { otp: "" } });

  async function sendCode(phone: string) {
    setError(null);
    setSending(true);
    try {
      const res = await authApi.requestOtp(toE164India(phone));
      setChallenge({ id: res.challengeId, phone });
      setCooldown(RESEND_SECONDS);
      codeForm.reset({ otp: "" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function verify(data: OtpCodeInput) {
    if (!challenge) return;
    setError(null);
    try {
      onSignedIn(await authApi.verifyOtp(toE164India(challenge.phone), challenge.id, data.otp));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (!challenge) {
    return (
      <form onSubmit={phoneForm.handleSubmit((d) => sendCode(d.phone))} noValidate className="space-y-4" aria-label="Request a sign-in code">
        <div>
          <FieldLabel htmlFor="otp-phone">Mobile number</FieldLabel>
          <Input id="otp-phone" type="tel" inputMode="numeric" maxLength={10} icon={Phone} autoComplete="tel-national" placeholder="10 digit mobile number" error={phoneForm.formState.errors.phone?.message} {...phoneForm.register("phone")} />
        </div>
        <button type="submit" disabled={sending} className={submitClass}>
          {sending ? "Sending code..." : "Send code"}
        </button>
        <FormMessage>{error}</FormMessage>
      </form>
    );
  }

  return (
    <form onSubmit={codeForm.handleSubmit(verify)} noValidate className="space-y-4" aria-label="Enter your sign-in code">
      <p className="text-sm text-muted dark:text-slate-400">
        If <span className="font-semibold text-navy dark:text-white">+91 {challenge.phone}</span> is registered, we&apos;ve sent it a 6 digit code.
      </p>
      <div>
        <FieldLabel htmlFor="otp-code">Code</FieldLabel>
        <Input id="otp-code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" icon={MessageSquareText} placeholder="6 digit code" error={codeForm.formState.errors.otp?.message} {...codeForm.register("otp")} />
      </div>
      <button type="submit" disabled={codeForm.formState.isSubmitting} className={submitClass}>
        {codeForm.formState.isSubmitting ? "Verifying..." : "Verify & sign in"}
      </button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={() => setChallenge(null)} className="font-semibold text-muted hover:text-navy dark:text-slate-400">
          Change number
        </button>
        <button
          type="button"
          disabled={cooldown > 0 || sending}
          onClick={() => void sendCode(challenge.phone)}
          className="font-semibold text-primary-blue disabled:cursor-not-allowed disabled:text-muted dark:text-bright-blue"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
      <FormMessage>{error}</FormMessage>
    </form>
  );
}
