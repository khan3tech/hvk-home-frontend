"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Lock,
  Mail,
  MapPinned,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { FieldLabel, FormMessage, PasswordInput } from "@/components/portal/form-field";
import { CONTACT_EMAIL, INDIAN_STATES, SITE_NAME } from "@/lib/constants";
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from "@/lib/legal-content";
import {
  candidateRegistrationSchema,
  toE164India,
  type CandidateRegistrationInput,
} from "@/lib/validations";
import { authApi } from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { STEP_ROUTE } from "@/lib/journey";
import { useSession } from "@/lib/session/session-provider";
import { cn } from "@/lib/utils";

/** API field names → form field names. */
const FIELD_MAP: Record<string, Path<CandidateRegistrationInput>> = {
  fullName: "fullName",
  email: "email",
  phone: "contactNumber",
  college: "college",
  place: "place",
  city: "city",
  state: "state",
  pincode: "pincode",
  password: "password",
  acceptTerms: "acceptTerms",
};

export function RegistrationForm({ variant = "page", onClose }: { variant?: "page" | "dialog"; onClose?: () => void } = {}) {
  const isDialog = variant === "dialog";
  const router = useRouter();
  const session = useSession();
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<React.ReactNode>(null);
  const [legalDocument, setLegalDocument] = React.useState<"terms" | "privacy" | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CandidateRegistrationInput>({
    resolver: zodResolver(candidateRegistrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      contactNumber: "",
      college: "",
      place: "",
      city: "",
      state: "",
      pincode: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(data: CandidateRegistrationInput) {
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await authApi.register({
        fullName: data.fullName,
        email: data.email,
        phone: toE164India(data.contactNumber),
        college: data.college,
        place: data.place,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        password: data.password,
        acceptTerms: true,
      });
      session.signIn(result);
      router.push(STEP_ROUTE[result.candidate.onboardingStep]);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError && err.code === "ACCOUNT_EXISTS") {
        setFormError(
          <>
            {err.message}{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </>,
        );
        return;
      }
      if (err instanceof ApiError) {
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          const target = FIELD_MAP[field];
          if (target) setError(target, { message });
        }
      }
      setFormError(errorMessage(err));
    }
  }

  return (
    <section id="registration" className={isDialog ? "bg-app-bg dark:bg-dark-bg" : "relative bg-app-bg py-14 dark:bg-dark-bg sm:py-16 lg:py-20"}>

      <div className={isDialog ? "w-full" : "container"}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={isDialog ? "relative rounded-2xl bg-white p-5 dark:bg-dark-surface sm:p-8" : "relative rounded-xl2 border border-slate-100 bg-white p-6 shadow-card-hover dark:border-white/10 dark:bg-dark-surface sm:p-8 lg:p-10"}
        >
          {isDialog && onClose ? (
            <button type="button" onClick={onClose} aria-label="Close registration" className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-blue dark:hover:bg-white/10 dark:hover:text-white">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
          <div className={isDialog ? "hidden" : "hidden items-center gap-3 rounded-full border border-light-blue bg-white py-2 pl-3 pr-4 shadow-card-hover dark:border-white/10 dark:bg-dark-surface-alt sm:absolute sm:-top-5 sm:right-8 sm:flex lg:-top-6 lg:right-10"}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-light-blue text-primary-blue dark:bg-bright-blue/10 dark:text-bright-blue">
              <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-xs font-bold text-navy dark:text-white">
                Secure Your Seat
              </span>
              <span className="block text-[11px] text-muted dark:text-slate-400">
                Limited Seats Available. Join Us!
              </span>
            </span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">
              Get Started Today
            </span>
            <h2 id={isDialog ? "registration-title" : undefined} className={`mt-2 text-2xl font-extrabold text-navy dark:text-white sm:text-3xl ${isDialog ? "pr-10" : ""}`}>
              Candidate Registration
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted dark:text-slate-400">
              Fill in your details to register for our programs and take the
              first step towards a brighter future with HVK Tech Online Examination.
            </p>

            {!isDialog ? <div className="mt-4 flex items-center gap-3 rounded-full border border-light-blue bg-light-blue/40 py-2 pl-3 pr-4 dark:border-white/10 dark:bg-dark-surface-alt sm:hidden">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary-blue dark:bg-bright-blue/10 dark:text-bright-blue">
                <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-bold text-navy dark:text-white">
                  Secure Your Seat
                </span>
                <span className="block text-[11px] text-muted dark:text-slate-400">
                  Limited Seats Available. Join Us!
                </span>
              </span>
            </div> : null}

            {session.status === "authenticated" ? (
              <div className="mt-6 rounded-lg border border-light-blue bg-light-blue/40 p-5 dark:border-white/10 dark:bg-dark-surface-alt">
                <p className="text-sm font-semibold text-navy dark:text-white">
                  You&apos;re signed in as {session.candidate?.fullName}.
                </p>
                <Link href="/dashboard" className={cn(buttonVariants({ variant: "primary" }), "mt-4")}>
                  Continue to your dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-6 space-y-5"
              noValidate
              aria-label="Candidate registration"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                  <Input id="fullName" icon={User} autoComplete="name" placeholder="Enter your full name" error={errors.fullName?.message} {...register("fullName")} />
                </div>
                <div>
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>
                  <Input id="email" type="email" icon={Mail} autoComplete="email" placeholder="Enter your email address" error={errors.email?.message} {...register("email")} />
                </div>
                <div>
                  <FieldLabel htmlFor="contactNumber">Contact Number</FieldLabel>
                  <Input id="contactNumber" type="tel" inputMode="numeric" icon={Phone} autoComplete="tel-national" placeholder="Enter 10 digit mobile number" maxLength={10} error={errors.contactNumber?.message} {...register("contactNumber")} />
                </div>
                <div>
                  <FieldLabel htmlFor="college">College / University</FieldLabel>
                  <Input id="college" icon={GraduationCap} placeholder="Enter your college name" error={errors.college?.message} {...register("college")} />
                </div>
                <div>
                  <FieldLabel htmlFor="place">Place / Locality</FieldLabel>
                  <Input id="place" icon={MapPinned} placeholder="Enter your area or locality" error={errors.place?.message} {...register("place")} />
                </div>
                <div>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <Input id="city" icon={Building2} autoComplete="address-level2" placeholder="Enter your city" error={errors.city?.message} {...register("city")} />
                </div>
                <div>
                  <FieldLabel htmlFor="state">State</FieldLabel>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field }) => (
                      <SearchableSelect
                        id="state"
                        name={field.name}
                        options={INDIAN_STATES}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Select state"
                        error={errors.state?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
                  <Input id="pincode" type="text" inputMode="numeric" icon={Lock} autoComplete="postal-code" placeholder="Enter 6 digit pincode" maxLength={6} error={errors.pincode?.message} {...register("pincode")} />
                </div>
                <div>
                  <FieldLabel htmlFor="password">Create Password</FieldLabel>
                  <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register("password")} />
                </div>
                <div>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="Re-enter your password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 text-sm text-ink dark:text-slate-200">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-bright-blue focus:ring-bright-blue"
                    aria-label="I agree to the Terms and Conditions and Privacy Policy"
                    aria-invalid={!!errors.acceptTerms}
                    aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
                    {...register("acceptTerms")}
                  />
                  <div>
                    <label htmlFor="acceptTerms">I agree to the</label>{" "}
                    <button type="button" onClick={() => setLegalDocument("terms")} aria-haspopup="dialog" className="font-semibold text-primary-blue underline dark:text-bright-blue">Terms &amp; Conditions</button>{" "}
                    and{" "}
                    <button type="button" onClick={() => setLegalDocument("privacy")} aria-haspopup="dialog" className="font-semibold text-primary-blue underline dark:text-bright-blue">Privacy Policy</button>
                  </div>
                </div>
                {errors.acceptTerms ? (
                  <p id="acceptTerms-error" className="mt-1.5 text-xs font-medium text-red-500">{errors.acceptTerms.message}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-bright-blue px-6 py-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-blue disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Creating your account..." : "Create Account & Continue"}
                <span aria-hidden="true">→</span>
              </button>

              <p className="text-center text-sm text-muted dark:text-slate-400">
                Already registered?{" "}
                {isDialog && onClose ? (
                  <button type="button" onClick={onClose} className="font-semibold text-primary-blue underline dark:text-bright-blue">Sign in</button>
                ) : (
                  <Link href="/login" className="font-semibold text-primary-blue underline dark:text-bright-blue">Sign in</Link>
                )}
              </p>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted dark:text-slate-400">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Your information is safe and secure with us.
              </p>

              <div className="text-center">
                <FormMessage>{formError}</FormMessage>
              </div>
            </form>
            )}
          </div>
        </motion.div>
      </div>
      {legalDocument ? <LegalDocumentDialog document={legalDocument} onClose={() => setLegalDocument(null)} /> : null}
    </section>
  );
}

function LegalDocumentDialog({ document, onClose }: { document: "terms" | "privacy"; onClose: () => void }) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const isTerms = document === "terms";
  const title = isTerms ? "Terms & Conditions" : "Privacy Policy";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

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
      aria-labelledby="registration-legal-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-navy/70 dark:bg-dark-surface"
    >
      <div className="relative p-6 sm:p-8">
        <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-blue dark:hover:bg-white/10 dark:hover:text-white">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">Legal</span>
        <h2 id="registration-legal-title" className="mt-2 pr-10 text-2xl font-extrabold text-navy dark:text-white">{title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted dark:text-slate-400">
          {isTerms
            ? `These Terms & Conditions govern your use of the ${SITE_NAME} website and registration for our programs.`
            : `This Privacy Policy explains how ${SITE_NAME} collects, uses, and protects the personal information you share with us through our website.`}
        </p>
        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-base font-bold text-navy dark:text-white">{section.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 border-t border-slate-100 pt-5 dark:border-white/10">
          <h3 className="text-base font-bold text-navy dark:text-white">Contact Us</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
            If you have questions about {isTerms ? "these Terms & Conditions" : "this Privacy Policy"}, please reach out to us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-blue hover:underline dark:text-bright-blue">{CONTACT_EMAIL}</a>.
          </p>
        </div>
        <div className="mt-7 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg bg-bright-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-blue">Close</button>
        </div>
      </div>
    </dialog>
  );
}
