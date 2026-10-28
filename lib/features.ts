/**
 * Feature switches read from NEXT_PUBLIC_* variables (set at build time on Netlify).
 *
 * Mobile OTP sign-in needs an SMS provider that actually delivers codes. Until one is live it stays off,
 * so candidates see email + password sign-in only. Set NEXT_PUBLIC_MOBILE_OTP_ENABLED=true to bring it back.
 */
export function mobileOtpEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MOBILE_OTP_ENABLED === "true";
}
