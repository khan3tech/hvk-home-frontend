"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api/client";
import { interiorsApi } from "@/lib/api/interiors";
import { INTERIOR_SERVICES } from "@/lib/interiors/content";
import { interiorContactSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { interiorsButton, interiorsInput } from "./ui";

/** A date in India (IST), `offsetDays` from today, as YYYY-MM-DD. */
export function istDate(offsetDays: number, now: number = Date.now()): string {
  return new Date(now + 5.5 * 3_600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

const SLOTS = [
  { value: "morning", label: "Morning (10 am to 1 pm)" },
  { value: "afternoon", label: "Afternoon (1 pm to 4 pm)" },
  { value: "evening", label: "Evening (4 pm to 7 pm)" },
] as const;

type Field = "name" | "phone" | "email" | "preferredDate";

/** Book a free consultation or site visit. */
export function ConsultationForm({ defaultService = "interior-design" }: { defaultService?: string }) {
  const [values, setValues] = React.useState({ name: "", phone: "", email: "", city: "", service: defaultService, preferredDate: istDate(1), slot: "morning" as (typeof SLOTS)[number]["value"], message: "" });
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);
  const honeypot = React.useRef<HTMLInputElement>(null);
  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [field]: e.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    const parsed = interiorContactSchema.safeParse({ name: values.name, phone: values.phone, email: values.email });
    if (!parsed.success) for (const issue of parsed.error.issues) next[issue.path[0] as Field] ??= issue.message;
    if (values.preferredDate < istDate(0) || values.preferredDate > istDate(90)) next.preferredDate = "Choose a date within the next 90 days";
    if (!parsed.success || next.preferredDate) {
      setErrors(next);
      return;
    }
    setErrors({});
    setFormError(null);
    setBusy(true);
    try {
      const result = await interiorsApi.bookConsultation({
        ...parsed.data,
        service: values.service,
        preferredDate: values.preferredDate,
        slot: values.slot,
        ...(values.city.trim() ? { city: values.city.trim() } : {}),
        ...(values.message.trim() ? { message: values.message.trim() } : {}),
        ...(honeypot.current?.value ? { website: honeypot.current.value } : {}),
      });
      setReference(result.reference);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        const mapped: Partial<Record<Field, string>> = {};
        for (const f of ["name", "phone", "email", "preferredDate"] as const) if (err.fieldErrors[f]) mapped[f] = err.fieldErrors[f];
        setErrors(mapped);
      }
      setFormError(err instanceof ApiError && err.status === 429 ? "Too many requests from this device. Please try again in a few minutes." : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <div role="status" className="rounded-lg border border-[#0f3b32] bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#0f3b32]" aria-hidden="true" />
        <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]">Your consultation request is in</h2>
        <p className="mt-2 text-sm">
          Reference <strong>{reference}</strong>. Our team will call you to confirm the time.
        </p>
      </div>
    );
  }

  const input = (id: Field | "city", label: string, type = "text", autoComplete?: string, required = true) => (
    <div>
      <label htmlFor={`consult-${id}`} className="block text-sm font-semibold">
        {label} {required ? <span className="text-red-600">*</span> : <span className="font-normal text-[#6a7873]">(optional)</span>}
      </label>
      <input
        id={`consult-${id}`}
        type={type}
        autoComplete={autoComplete}
        className={cn(interiorsInput)}
        value={values[id]}
        onChange={set(id)}
        {...(id === "preferredDate" ? { min: istDate(0), max: istDate(90) } : {})}
        aria-invalid={id !== "city" && Boolean(errors[id])}
      />
      {id !== "city" && errors[id] ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-700">
          {errors[id]}
        </p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="grid gap-4 rounded-lg border border-[#d8dcd2] bg-white p-6 sm:grid-cols-2 sm:p-8" aria-label="Book a free consultation">
      {input("name", "Your name", "text", "name")}
      {input("phone", "Mobile number", "tel", "tel-national")}
      {input("email", "Email", "email", "email")}
      {input("city", "City", "text", "address-level2", false)}
      <div>
        <label htmlFor="consult-service" className="block text-sm font-semibold">
          What do you need? <span className="text-red-600">*</span>
        </label>
        <select id="consult-service" className={interiorsInput} value={values.service} onChange={set("service")}>
          {INTERIOR_SERVICES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      {input("preferredDate", "Preferred date", "date")}
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-semibold">Preferred time</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SLOTS.map((slot) => (
            <label key={slot.value} className={cn("cursor-pointer rounded-full border px-4 py-1.5 text-sm", values.slot === slot.value ? "border-[#0f3b32] bg-[#0f3b32] text-white" : "border-[#cfd6cf] bg-white")}>
              <input type="radio" name="slot" className="sr-only" checked={values.slot === slot.value} onChange={() => setValues((v) => ({ ...v, slot: slot.value }))} />
              {slot.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <label htmlFor="consult-message" className="block text-sm font-semibold">
          Tell us about your space <span className="font-normal text-[#6a7873]">(optional)</span>
        </label>
        <textarea id="consult-message" rows={3} maxLength={2000} className={interiorsInput} value={values.message} onChange={set("message")} />
      </div>
      {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {formError ? (
        <p role="alert" className="text-sm font-medium text-red-700 sm:col-span-2">
          {formError}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className={interiorsButton}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {busy ? "Sending…" : "Book my free consultation"}
        </button>
      </div>
    </form>
  );
}
