import type { AuthResult, OtpChallenge, RegisterResult } from "@/types/api";
import { apiFetch } from "./client";

/** Auth endpoints use web session mode: the refresh token lives in an httpOnly cookie. */
const session = { auth: false, session: true } as const;

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  college: string;
  place: string;
  password: string;
  acceptTerms: true;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiFetch<RegisterResult>("/auth/register", { ...session, method: "POST", body: payload }),
  login: (emailOrPhone: string, password: string) =>
    apiFetch<AuthResult>("/auth/login", { ...session, method: "POST", body: { emailOrPhone, password } }),
  requestOtp: (phoneE164: string) =>
    apiFetch<OtpChallenge>("/auth/otp/request", { auth: false, method: "POST", body: { phoneE164, purpose: "login" } }),
  verifyOtp: (phoneE164: string, challengeId: string, otp: string) =>
    apiFetch<AuthResult>("/auth/otp/verify", { ...session, method: "POST", body: { phoneE164, challengeId, otp } }),
  /** Restores/rotates the session from the httpOnly cookie. */
  refresh: () => apiFetch<AuthResult>("/auth/refresh", { ...session, method: "POST", body: {} }),
  logout: () => apiFetch<void>("/auth/logout", { ...session, method: "POST", body: {} }),
  forgotPassword: (email: string) =>
    apiFetch<{ accepted: true }>("/auth/password/forgot", { auth: false, method: "POST", body: { email } }),
  resetPassword: (resetToken: string, newPassword: string) =>
    apiFetch<void>("/auth/password/reset", { auth: false, method: "POST", body: { resetToken, newPassword } }),
};
