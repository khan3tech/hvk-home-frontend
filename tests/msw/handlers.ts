import { HttpResponse, type RequestHandler } from "msw";
import type { AuthResult, Candidate, OnboardingStep, Role } from "@/types/api";

/** Base URL the app is configured with in tests (vitest.config.ts → NEXT_PUBLIC_API_BASE_URL). */
export const API = "http://api.test/api/v1";

/** Success envelope, as the backend sends it. */
export function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ data, meta: { requestId: "test-req" } }, { status });
}

/** Error envelope, as the backend sends it. */
export function fail(status: number, code: string, details: { path: string; message: string }[] = []) {
  return HttpResponse.json(
    { error: { code, message: `backend message for ${code}`, details }, meta: { requestId: "test-req" } },
    { status },
  );
}

export function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "6729f0c2a1b2c3d4e5f60718",
    fullName: "Asha Verma",
    email: "asha@example.com",
    phone: "+919876543210",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    college: "ABC Engineering College",
    place: "Kothrud",
    role: "candidate",
    onboardingStep: "demo_pending",
    demoAction: null,
    createdAt: "2026-10-14T00:00:00.000Z",
    ...overrides,
  };
}

export function authResult(opts: { role?: Role; step?: OnboardingStep; token?: string } = {}): AuthResult {
  return {
    accessToken: opts.token ?? "access-1",
    accessTokenExpiresIn: 900,
    candidate: makeCandidate({ role: opts.role ?? "candidate", onboardingStep: opts.step ?? "demo_pending" }),
  };
}

/** Handlers active in every test; individual tests add more with `server.use(...)`. */
export const defaultHandlers: RequestHandler[] = [];
