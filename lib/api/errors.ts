/** User-facing messages per API error code (contracts/api-consumed.md). */
export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Please check the highlighted fields.",
  BAD_REQUEST: "Something about that request wasn't right. Please try again.",
  INVALID_TOKEN: "This reset link is invalid or has expired. Request a new one.",
  INVALID_CREDENTIALS: "Incorrect details. Please try again.",
  UNAUTHENTICATED: "Your session has ended. Please sign in again.",
  INVALID_SIGNATURE: "We couldn't confirm your payment yet.",
  FORBIDDEN: "You don't have access to this page.",
  NOT_FOUND: "We couldn't find that.",
  ACCOUNT_EXISTS: "An account with these details already exists. Sign in instead.",
  FEEDBACK_EXISTS: "We already have your feedback — thank you!",
  CONFLICT: "That conflicts with existing data. Please refresh and try again.",
  INVALID_STATE: "This step isn't available right now. Let's take you to the right place.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  INTERNAL_ERROR: "Something went wrong on our side. Please try again.",
  NETWORK_ERROR: "Could not reach the server. Check your connection and try again.",
};

export const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

export function messageForCode(code: string): string {
  return ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}
