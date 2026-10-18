# Authentication Integration Contract

## Selected approach

Use the existing website's authenticated browser session through an HttpOnly, Secure, SameSite cookie. The exam frontend never reads or stores an access token. The Node backend validates the cookie/session on every request and derives the candidate identity from the verified session.

The configured session lifetime is 24 hours. Logout, expiry, account disablement, and upstream revocation must be honored by the verifier immediately; the exam service must not extend an expired upstream session.

The React client sends `credentials: include` on API requests so the browser's HttpOnly session cookie is available to the backend. Development-only identity headers are compiled into Vite development mode only; production builds do not send candidate or administrator identity headers.

The standalone server accepts an optional `AUTH_VERIFY_MODULE` path. The module must export `verifySession(session, request)` (or a default function) and return the identity object above. When the variable is absent, production remains fail-closed; no fabricated or request-header identity is accepted.

## Required identity result

The injected `authenticate(req)` adapter must return either `null` for an unauthenticated request or an object with this shape:

```js
{
  candidateId: "candidate@example.com",
  roles: ["candidate"],
  sessionExpiresAt: "2026-10-14T10:00:00.000Z"
}
```

An administrator must include a server-verified `admin` role. The candidate ID must be the immutable normalized email identity from the verified session, never a request header or form field.

## Provider inputs still required

- Existing website repository or authentication documentation.
- Cookie name and whether the backend shares the parent domain.
- Session verification method: shared session store, introspection endpoint, or signature verification.
- Session revocation and logout behavior.
- Exact administrator role/claim source.
- Allowed frontend and backend origins once domains are selected.
- CSRF token or trusted-origin strategy for cookie-authenticated mutations.

## Integration acceptance tests

- No cookie returns `401` on candidate and administrator APIs.
- Valid candidate cookie maps to the expected email identity.
- A candidate cannot read another candidate's attempt.
- A non-admin cookie returns `403` on administrator APIs.
- Expired and revoked cookies return `401` even if the browser still sends them.
- Logout invalidates subsequent exam requests.
- Cross-site state-changing requests fail CSRF/origin validation.
- Production state-changing requests include an `Origin` matching the configured frontend origin; missing or untrusted origins receive `403 CSRF_ORIGIN_REJECTED`.
- Cookie flags are `HttpOnly`, `Secure`, and the approved `SameSite` value in staging.
- Development identity headers remain unavailable when `NODE_ENV=production`.
