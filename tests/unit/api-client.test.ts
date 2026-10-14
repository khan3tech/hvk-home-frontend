import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, errorMessage, registerSessionBridge } from "@/lib/api/client";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";

afterEach(() => registerSessionBridge(null));

describe("apiFetch", () => {
  it("unwraps the success envelope and sends JSON", async () => {
    let seen: { body: unknown; type: string | null } | null = null;
    server.use(
      http.post(`${API}/things`, async ({ request }) => {
        seen = { body: await request.json(), type: request.headers.get("content-type") };
        return ok({ id: "1" }, 201);
      }),
    );
    await expect(apiFetch("/things", { method: "POST", body: { a: 1 }, auth: false })).resolves.toEqual({ id: "1" });
    expect(seen).toEqual({ body: { a: 1 }, type: "application/json" });
  });

  it("builds query strings and skips empty values", async () => {
    let url = "";
    server.use(
      http.get(`${API}/list`, ({ request }) => {
        url = request.url;
        return ok([]);
      }),
    );
    await apiFetch("/list", { auth: false, query: { status: "new", page: 2, from: "", to: undefined } });
    expect(new URL(url).search).toBe("?status=new&page=2");
  });

  it("returns undefined for 204", async () => {
    server.use(http.post(`${API}/empty`, () => new HttpResponse(null, { status: 204 })));
    await expect(apiFetch("/empty", { method: "POST", auth: false })).resolves.toBeUndefined();
  });

  it("maps error envelopes to ApiError with a friendly message and field errors", async () => {
    server.use(
      http.post(`${API}/register`, () =>
        fail(400, "VALIDATION_ERROR", [
          { path: "body.email", message: "Invalid email" },
          { path: "body.pincode", message: "Bad PIN" },
        ]),
      ),
    );
    const err = await apiFetch("/register", { method: "POST", body: {}, auth: false }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Please check the highlighted fields.",
      fieldErrors: { email: "Invalid email", pincode: "Bad PIN" },
    });
  });

  it("uses our message, never the raw backend text", async () => {
    server.use(http.post(`${API}/x`, () => fail(409, "ACCOUNT_EXISTS")));
    const err = (await apiFetch("/x", { method: "POST", auth: false }).catch((e: unknown) => e)) as ApiError;
    expect(err.message).toBe("An account with these details already exists. Sign in instead.");
    expect(errorMessage(new Error("boom"))).toBe("Something went wrong. Please try again.");
  });

  it("reports network failures as NETWORK_ERROR", async () => {
    server.use(http.get(`${API}/down`, () => HttpResponse.error()));
    await expect(apiFetch("/down", { auth: false })).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });

  it("treats non-JSON server errors as INTERNAL_ERROR", async () => {
    server.use(http.get(`${API}/html`, () => new HttpResponse("<html>", { status: 502 })));
    await expect(apiFetch("/html", { auth: false })).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });

  it("session mode sends the cookie header and credentials", async () => {
    let mode: string | null = null;
    server.use(
      http.post(`${API}/auth/refresh`, ({ request }) => {
        mode = request.headers.get("x-session-mode");
        return ok({});
      }),
    );
    await apiFetch("/auth/refresh", { method: "POST", body: {}, auth: false, session: true });
    expect(mode).toBe("cookie");
  });
});

describe("apiFetch with a session", () => {
  it("attaches the bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get(`${API}/me`, ({ request }) => {
        auth = request.headers.get("authorization");
        return ok({});
      }),
    );
    registerSessionBridge({ getAccessToken: () => "tok-1", refresh: async () => null, onUnauthenticated: vi.fn() });
    await apiFetch("/me");
    expect(auth).toBe("Bearer tok-1");
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    const tokens: (string | null)[] = [];
    server.use(
      http.get(`${API}/me`, ({ request }) => {
        const t = request.headers.get("authorization");
        tokens.push(t);
        return t === "Bearer fresh" ? ok({ ok: true }) : fail(401, "UNAUTHENTICATED");
      }),
    );
    const refresh = vi.fn().mockResolvedValue("fresh");
    registerSessionBridge({ getAccessToken: () => "stale", refresh, onUnauthenticated: vi.fn() });
    await expect(apiFetch("/me")).resolves.toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledOnce();
    expect(tokens).toEqual(["Bearer stale", "Bearer fresh"]);
  });

  it("signs out when the refresh fails", async () => {
    server.use(http.get(`${API}/me`, () => fail(401, "UNAUTHENTICATED")));
    const onUnauthenticated = vi.fn();
    registerSessionBridge({ getAccessToken: () => "stale", refresh: async () => null, onUnauthenticated });
    await expect(apiFetch("/me")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(onUnauthenticated).toHaveBeenCalledOnce();
  });

  it("a business 401 (e.g. INVALID_SIGNATURE) neither refreshes nor signs out", async () => {
    server.use(http.post(`${API}/payments/verify`, () => fail(401, "INVALID_SIGNATURE")));
    const refresh = vi.fn();
    const onUnauthenticated = vi.fn();
    registerSessionBridge({ getAccessToken: () => "tok", refresh, onUnauthenticated });
    await expect(apiFetch("/payments/verify", { method: "POST", body: {} })).rejects.toMatchObject({
      code: "INVALID_SIGNATURE",
    });
    expect(refresh).not.toHaveBeenCalled();
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it("does not refresh for unauthenticated calls", async () => {
    server.use(http.post(`${API}/auth/login`, () => fail(401, "INVALID_CREDENTIALS")));
    const refresh = vi.fn();
    registerSessionBridge({ getAccessToken: () => null, refresh, onUnauthenticated: vi.fn() });
    await expect(apiFetch("/auth/login", { method: "POST", body: {}, auth: false })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Incorrect details. Please try again.",
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
