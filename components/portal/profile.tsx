"use client";

import * as React from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, GraduationCap, Lock, Mail, MapPinned, Phone, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { INDIAN_STATES } from "@/lib/constants";
import { portalApi } from "@/lib/api/portal";
import { ApiError, errorMessage } from "@/lib/api/client";
import { useSession } from "@/lib/session/session-provider";
import { FieldLabel, FormMessage } from "./form-field";
import { PageShell } from "./page-shell";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  college: z.string().trim().min(2, "Please enter your college").max(150),
  place: z.string().trim().min(2, "Please enter your locality").max(100),
  city: z.string().trim().min(2, "Please enter your city").max(100),
  state: z.string().trim().min(2, "Please select your state"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6 digit pincode"),
});
type ProfileInput = z.infer<typeof profileSchema>;

/** View and edit the allowlisted profile fields (email and phone are read-only). */
export function Profile() {
  const { candidate, setCandidate } = useSession();
  const [message, setMessage] = React.useState<{ tone: "error" | "success"; text: string } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: candidate?.fullName ?? "",
      college: candidate?.college ?? "",
      place: candidate?.place ?? "",
      city: candidate?.city ?? "",
      state: candidate?.state ?? "",
      pincode: candidate?.pincode ?? "",
    },
  });

  async function onSubmit(data: ProfileInput) {
    setMessage(null);
    try {
      const updated = await portalApi.updateMe(data);
      setCandidate(updated);
      reset(data);
      setMessage({ tone: "success", text: "Your profile has been saved." });
    } catch (err) {
      if (err instanceof ApiError) {
        for (const [field, msg] of Object.entries(err.fieldErrors)) {
          if (field in data) setError(field as Path<ProfileInput>, { message: msg });
        }
      }
      setMessage({ tone: "error", text: errorMessage(err) });
    }
  }

  if (!candidate) return null;

  return (
    <PageShell eyebrow="Account" title="My profile">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-label="Edit profile">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="p-email" required={false}>Email</FieldLabel>
            <Input id="p-email" icon={Mail} value={candidate.email} readOnly disabled />
          </div>
          <div>
            <FieldLabel htmlFor="p-phone" required={false}>Mobile</FieldLabel>
            <Input id="p-phone" icon={Phone} value={candidate.phone} readOnly disabled />
          </div>
          <div>
            <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
            <Input id="fullName" icon={User} error={errors.fullName?.message} {...register("fullName")} />
          </div>
          <div>
            <FieldLabel htmlFor="college">College / University</FieldLabel>
            <Input id="college" icon={GraduationCap} error={errors.college?.message} {...register("college")} />
          </div>
          <div>
            <FieldLabel htmlFor="place">Place / Locality</FieldLabel>
            <Input id="place" icon={MapPinned} error={errors.place?.message} {...register("place")} />
          </div>
          <div>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input id="city" icon={Building2} error={errors.city?.message} {...register("city")} />
          </div>
          <div>
            <FieldLabel htmlFor="state">State</FieldLabel>
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <SearchableSelect id="state" name={field.name} options={INDIAN_STATES} value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="Select state" error={errors.state?.message} />
              )}
            />
          </div>
          <div>
            <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
            <Input id="pincode" inputMode="numeric" maxLength={6} icon={Lock} error={errors.pincode?.message} {...register("pincode")} />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      </form>
    </PageShell>
  );
}
