import type { ApiErrorBody, ApiSuccess } from "@/types/api";
import { FALLBACK_MESSAGE, messageForCode } from "./errors";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const API_PREFIX = "/api/v1";

/** Error thrown for every failed API call. `fieldErrors` keys match form field names. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Friendly message for any thrown value. */
export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : FALLBACK_MESSAGE;
}

/** Hooks the session layer registers so the client can attach and refresh tokens. */
export interface SessionBridge {
  getAccessToken(): string | null;
  /** Refreshes the session; resolves to the new access token or null when signed out. */
  refresh(): Promise<string | null>;
  onUnauthenticated(): void;
}

let bridge: SessionBridge | null = null;

export function registerSessionBridge(next: SessionBridge | null): void {
  bridge = next;
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  /** Attach the bearer token and refresh once on 401 (default true). */
  auth?: boolean;
  /** Web session mode: send/receive the httpOnly refresh cookie (auth endpoints). */
  session?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: ApiOptions["query"]): string {
  const url = new URL(`${API_BASE_URL}${API_PREFIX}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** `body.email` → `email`, `params.id` → `id`; ignores entries without a field. */
function toFieldErrors(details: ApiErrorBody["error"]["details"] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of details ?? []) {
    const field = d.path.split(".").slice(1).join(".");
    if (field && !out[field]) out[field] = d.message;
  }
  return out;
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | null = null;
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    body = null;
  }
  const code = body?.error?.code ?? (response.status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
  return new ApiError(response.status, code, messageForCode(code), toFieldErrors(body?.error?.details));
}

async function send(path: string, opts: ApiOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.session) headers["X-Session-Mode"] = "cookie";
  try {
    return await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? (opts.body === undefined ? "GET" : "POST"),
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: opts.session ? "include" : "omit",
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK_ERROR", messageForCode("NETWORK_ERROR"));
  }
}

/** Calls the API and returns `data` from the success envelope; throws ApiError otherwise. */
export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const useAuth = opts.auth ?? true;
  let response = await send(path, opts, useAuth ? (bridge?.getAccessToken() ?? null) : null);

  if (response.status === 401 && useAuth && bridge) {
    const fresh = await bridge.refresh();
    if (!fresh) {
      bridge.onUnauthenticated();
      throw await toApiError(response);
    }
    response = await send(path, opts, fresh);
    if (response.status === 401) bridge.onUnauthenticated();
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  try {
    return ((await response.json()) as ApiSuccess<T>).data;
  } catch {
    throw new ApiError(response.status, "BAD_REQUEST", FALLBACK_MESSAGE);
  }
}
