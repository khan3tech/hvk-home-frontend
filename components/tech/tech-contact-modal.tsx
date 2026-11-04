"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api/client";
import { enquiriesApi } from "@/lib/api/enquiries";
import { enquirySchema } from "@/lib/validations";

type Field = "email" | "phone" | "message";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-[#d9cfbd] bg-white px-3 py-2.5 text-sm text-[#16130f] placeholder:text-[#9a8f7c] focus:border-gold-deep focus:outline-none focus:ring-2 focus:ring-gold/40";

const DEFAULT_BUTTON =
  "inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-[#1a140b] transition hover:bg-gold-deep hover:text-white";

/** A button that opens the enquiry form (email, contact number, query). Used by the header and the contact section. */
export function TalkToUs({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={className ?? DEFAULT_BUTTON}
      >
        {children ?? (
          <>
            Talk To Us <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
      {open ? <ContactDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ContactDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [values, setValues] = React.useState({ email: "", phone: "", message: "" });
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const honeypot = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const set = (field: Field) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [field]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = enquirySchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        next[key] ??= issue.message;
      }
      setErrors(next);
      setFormError(null);
      return;
    }
    setErrors({});
    setFormError(null);
    setBusy(true);
    try {
      await enquiriesApi.send({ ...parsed.data, ...(honeypot.current?.value ? { website: honeypot.current.value } : {}) });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        const next: Partial<Record<Field, string>> = {};
        for (const field of ["email", "phone", "message"] as const) {
          const message = err.fieldErrors[field];
          if (message) next[field] = message;
        }
        setErrors(next);
      }
      setFormError(err instanceof ApiError && err.status === 429 ? "Too many messages from this device. Please try again in a few minutes." : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="talk-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-0 bg-cream p-0 text-[#16130f] shadow-2xl backdrop:bg-black/70"
    >
      <div className="relative p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-2 text-[#7a6a52] hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {sent ? (
          <div role="status" className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-gold-deep" aria-hidden="true" />
            <h2 id="talk-title" className="mt-3 text-2xl font-medium">
              Thank you!
            </h2>
            <p className="mt-2 text-sm text-[#3d3730]">We&apos;ve received your message and will get back to you soon.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-[#1a140b] transition hover:bg-gold-deep hover:text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} noValidate>
            <h2 id="talk-title" className="pr-10 text-2xl font-medium">
              Talk to us
            </h2>
            <p className="mt-1 text-sm text-[#3d3730]">Leave your details and a short note. Our team will reach out.</p>

            <Labelled id="talk-email" label="Email" error={errors.email}>
              <input id="talk-email" type="email" autoComplete="email" value={values.email} onChange={set("email")} className={inputClass} aria-invalid={Boolean(errors.email)} placeholder="you@example.com" />
            </Labelled>
            <Labelled id="talk-phone" label="Contact number" error={errors.phone}>
              <input id="talk-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={values.phone} onChange={set("phone")} className={inputClass} aria-invalid={Boolean(errors.phone)} placeholder="10 digit mobile number" />
            </Labelled>
            <Labelled id="talk-message" label="Your query" error={errors.message}>
              <textarea id="talk-message" rows={4} maxLength={2000} value={values.message} onChange={set("message")} className={inputClass} aria-invalid={Boolean(errors.message)} placeholder="How can we help?" />
            </Labelled>

            {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {formError ? (
              <p role="alert" className="mt-4 text-sm font-medium text-red-700">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-[#1a140b] transition hover:bg-gold-deep hover:text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

function Labelled({ id, label, error, children }: { id: string; label: string; error: string | undefined; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label} <span className="text-red-600">*</span>
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
