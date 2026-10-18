# Frontend production readiness

- Next.js standalone output is enabled for a minimal production container.
- `Dockerfile` builds with `NEXT_PUBLIC_API_BASE_URL` and exposes port `3000`.
- `.dockerignore` excludes secrets, dependencies, build output and test artifacts.
- CI validates typecheck, lint, unit tests, production build and Playwright smoke/accessibility tests.
- The exam route requires the existing HVK authenticated session and uses the backend invitation/session contract.

Build the image with:

```bash
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com -t hvk-home-frontend:production .
```

The deployed HTTPS frontend origin must be configured in the backend as `EXAM_FRONTEND_URL` and `CORS_ORIGINS`.
