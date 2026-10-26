# Exam Link and Security — Frontend

## Candidate URL

The exam link is a normal frontend route. A separate exam subdomain is not required:

```text
https://hvk-home.example.com/exam/invite/<raw-invitation-token>
```

The frontend reads the token from the route, calls the backend invitation endpoint, and never decodes or trusts the token locally.

The API can be same-origin (`/api/v1`) or use a separate API hostname. The backend documentation is the source of truth for the reverse-proxy, CORS, cookie and DNS configuration.

## Link lifecycle

1. Admin publishes an exam in the admin panel.
2. Backend creates an idempotent invitation for each eligible registered candidate.
3. Backend emails the raw, opaque invitation token through the notification worker.
4. Candidate opens the frontend route and signs in through the existing HVK auth flow.
5. Backend validates the token against its hash and checks that the logged-in candidate owns it.
6. Candidate grants camera access and clicks Start.
7. Frontend sends a tab-specific client ID; backend returns the active session ID.
8. A second tab/device is shown the active-session conflict screen.

## Frontend protections

- Token is treated as an opaque route value and is not stored in application state beyond the active page request.
- Candidate ID is never taken from the URL or request body.
- `clientInstanceId` is generated with `crypto.randomUUID()` and stored only in `sessionStorage`, so another tab gets a different identity.
- The frontend sends the server session and client ID on every attempt operation.
- Questions never render answer keys.
- Answers autosave and show save/error states.
- Manual submission always uses a confirmation dialog.
- Browser leave confirmation, tab-hidden detection and fullscreen-exit detection are enabled during an active attempt.
- Camera video is hidden from the candidate; BlazeFace runs locally and only sends `NO_FACE`/`MULTIPLE_FACE` event types.
- Warning count is shown as `x/5`; security dialogs explain the corrective action.
- Raw backend error codes are mapped to candidate-friendly messages.

## Deployment choices

### Same-origin

```text
Frontend: https://hvk-home.example.com
API:      https://hvk-home.example.com/api/v1
```

Use a reverse proxy or platform routing rule. This minimizes CORS and cross-site cookie complexity.

### Separate API hostname

```text
Frontend: https://hvk-home.example.com
API:      https://api.hvk-home.example.com/api/v1
```

Set the frontend build variable to the API hostname and configure the backend `CORS_ORIGINS` to the exact frontend origin. Both hosts must use HTTPS.

## What browser security cannot guarantee

Normal browser JavaScript cannot fully disable tab switching, operating-system switching, screenshots, another device, or browser termination. The implementation records visibility/fullscreen/camera signals and enforces the authoritative backend session; it does not claim that a signal alone proves cheating.

## Production checklist

- Frontend is served over HTTPS.
- API URL is configured at build time.
- `EXAM_FRONTEND_URL` points to the frontend origin.
- Backend `CORS_ORIGINS` contains only the frontend origin.
- Existing HVK authentication and secure cookies work on the selected topology.
- SMTP invitation delivery is configured and tested.
- Camera permission is tested on supported desktop browsers.
- Admin publishes a test exam and confirms one email per eligible candidate.
- Same-tab resume and second-tab `ACTIVE_SESSION_EXISTS` are verified.
- Revoke/expiry, manual submission, result publication and result-pending states are verified.
