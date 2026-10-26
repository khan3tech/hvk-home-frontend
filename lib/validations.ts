import { z } from "zod";

/** Client-side rules mirror the Candidate Platform API (UX only — the API is authoritative). */

const indianMobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number");

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Password is too long");

const email = z
  .string()
  .trim()
  .min(1, "Email address is required")
  .email("Please enter a valid email address");

export const candidateRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name").max(100, "Name is too long"),
    email,
    contactNumber: indianMobile,
    college: z.string().trim().min(2, "Please enter your college or university").max(150, "Name is too long"),
    place: z.string().trim().min(2, "Please enter your locality").max(100, "Locality is too long"),
    city: z.string().trim().min(2, "Please enter your city").max(100, "City is too long"),
    state: z.string().trim().min(2, "Please select your state"),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6 digit pincode"),
    password,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, "Please accept the terms to continue"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type CandidateRegistrationInput = z.infer<typeof candidateRegistrationSchema>;

export const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(3, "Enter your email or mobile number"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const otpPhoneSchema = z.object({ phone: indianMobile });
export type OtpPhoneInput = z.infer<typeof otpPhoneSchema>;

export const otpCodeSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6 digit code"),
});
export type OtpCodeInput = z.infer<typeof otpCodeSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** 10-digit Indian mobile → E.164 (+91…). Other input is returned trimmed. */
export function toE164India(value: string): string {
  const v = value.trim();
  return /^[6-9]\d{9}$/.test(v) ? `+91${v}` : v;
}
