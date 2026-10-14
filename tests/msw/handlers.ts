import type { RequestHandler } from "msw";

/** Base URL the app is configured with in tests (vitest.config.ts → NEXT_PUBLIC_API_BASE_URL). */
export const API = "http://api.test/api/v1";

/** Handlers active in every test; individual tests add more with `server.use(...)`. */
export const defaultHandlers: RequestHandler[] = [];
